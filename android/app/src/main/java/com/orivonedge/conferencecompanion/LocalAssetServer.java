package com.orivonedge.conferencecompanion;

import android.content.res.AssetManager;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.InetAddress;
import java.net.ServerSocket;
import java.net.Socket;
/**
 * Minimal loopback HTTP file server for the bundled web app.
 *
 * WHY THIS EXISTS
 * Releases 1.0.9-1.0.12 all showed "Webpage not available" /
 * net::ERR_INVALID_RESPONSE on one real device for the very first document
 * load, with every WebViewAssetLoader configuration tried (single loader,
 * double loader, manual static handler). Interception of the main-frame
 * request through the https://appassets.androidplatform.net scheme is simply
 * not reliable on every WebView build, so this class removes interception
 * entirely: it runs a plain HTTP/1.1 file server on 127.0.0.1 on an ephemeral
 * port and the WebView loads http://127.0.0.1:<port>/ like any normal website.
 *
 * - Loopback is per-UID-protected on Android: no other app can reach it.
 * - Browsers (Chromium ≥ 88) treat http://127.0.0.1 as a *potentially
 *   trustworthy origin* (secure context), so crypto.subtle (Supabase auth
 *   PKCE), fetch to https:// APIs and service-worker-adjacent APIs keep
 *   working exactly as on https.
 * - Because it is a real HTTP origin (not file://), ES modules,
 *   root-absolute URLs and CORS all behave normally, and the web bundle
 *   needs NO changes: the Vite build (base "/assets/") is copied flat into
 *   the APK assets root and the mapping below turns every URL into the
 *   matching asset path.
 *
 * URL -> asset mapping
 *   /assets/<rest>     -> asset <rest>      (Vite base second segment)
 *   /<rest>            -> asset <rest>      (/nse_crest.png, /hotels/..., ...)
 *   /                  -> index.html
 */
public final class LocalAssetServer {

    /** Only ever wrap fields used from the accept thread. */
    private volatile ServerSocket serverSocket;
    private volatile boolean running;
    private final AssetManager assets;

    public LocalAssetServer(AssetManager assets) {
        this.assets = assets;
    }

    /** Binds to an OS-assigned port on 127.0.0.1 and starts the accept loop.
     *  Returns the port the WebView should use. */
    public int start() throws IOException {
        InetAddress loopback = InetAddress.getByName("127.0.0.1");
        ServerSocket socket = new ServerSocket(0, 32, loopback);
        this.serverSocket = socket;
        this.running = true;
        final int port = socket.getLocalPort();
        Thread acceptor = new Thread(new Runnable() {
            @Override
            public void run() {
                while (running) {
                    try {
                        Socket client = serverSocket.accept();
                        Thread t = new Thread(new Runnable() {
                            @Override
                            public void run() {
                                handle(client);
                            }
                        });
                        t.setDaemon(true);
                        t.start();
                    } catch (Throwable t) {
                        if (running) {
                            // Transient accept failure: brief pause, keep serving.
                            try { Thread.sleep(50); } catch (InterruptedException ignored) {}
                        }
                    }
                }
            }
        }, "LocalAssetServer-accept");
        acceptor.setDaemon(true);
        acceptor.start();
        return port;
    }

    /** Stops accepting and closes the listener (listener close interrupts accept). */
    public void stop() {
        running = false;
        ServerSocket socket = this.serverSocket;
        if (socket != null) {
            try { socket.close(); } catch (IOException ignored) {}
        }
    }

    // ------------------------------------------------------------------ //

    private void handle(Socket client) {
        InputStream in = null;
        OutputStream out = null;
        try {
            client.setReceiveBufferSize(64 * 1024);
            client.setTcpNoDelay(true);
            in = client.getInputStream();
            out = client.getOutputStream();

            String requestLine = readLine(in);
            if (requestLine == null || requestLine.length() == 0) return;
            // Drain all headers up to the blank line so leftover bytes are never
            // mistaken for a second request on a keep-alive connection.
            String header;
            while ((header = readLine(in)) != null && header.length() > 0) { /* drain */ }

            String[] parts = requestLine.split("\\s+");
            if (parts.length < 2) {
                writeResponse(out, 400, "Bad Request", "text/plain", new byte[0], true);
                return;
            }
            String method = parts[0];
            String rawPath = parts[1];

            boolean isHead = "HEAD".equalsIgnoreCase(method);
            boolean isGet = "GET".equalsIgnoreCase(method);
            if (!isGet && !isHead) {
                writeResponse(out, 405, "Method Not Allowed", "text/plain", new byte[0], true);
                return;
            }

            String assetPath = mapToAsset(rawPath);
            if (assetPath == null) {
                writeResponse(out, 403, "Forbidden", "text/plain", new byte[0], true);
                return;
            }

            byte[] body = readAsset(assetPath);
            if (body == null) {
                writeResponse(out, 404, "Not Found", "text/plain", new byte[0], true);
                return;
            }
            writeResponse(out, 200, "OK", guessMime(assetPath), isHead ? new byte[0] : body, true);
        } catch (Throwable t) {
            // Never crash the app over one bad request.
            try { client.close(); } catch (Throwable ignored) {}
        } finally {
            try {
                // Connection: close — not keep-alive; one response per socket.
                if (in != null) in.close();
                if (out != null) out.close();
                client.close();
            } catch (Throwable ignored) {}
        }
    }

    private void writeResponse(OutputStream out, int code, String reason,
                               String mime, byte[] body, boolean close) throws IOException {
        StringBuilder head = new StringBuilder(128);
        head.append("HTTP/1.1 ").append(code).append(' ').append(reason).append("\r\n");
        head.append("Content-Type: ").append(mime).append("\r\n");
        head.append("Content-Length: ").append(body.length).append("\r\n");
        head.append("Cache-Control: no-cache\r\n");
        head.append("Access-Control-Allow-Origin: *\r\n");
        head.append("Connection: close\r\n");
        head.append("\r\n");
        out.write(head.toString().getBytes("US-ASCII"));
        if (body.length > 0) out.write(body);
        out.flush();
    }

    // ------------------------------------------------------------------ //

    /** One full request line / header line; InputStream is raw (no buffering,
     *  so draining stop bytes exactly matters). */
    private static String readLine(InputStream in) throws IOException {
        StringBuilder sb = new StringBuilder(128);
        int c;
        while ((c = in.read()) != -1) {
            if (c == '\n') break;
            sb.append((char) c);
        }
        String s = sb.toString();
        if (s.endsWith("\r")) s = s.substring(0, s.length() - 1);
        return s;
    }

    /** Strips any query string, then applies the URL -> asset mapping. */
    private static String mapToAsset(String rawPath) throws IOException {
        String p = rawPath;
        int q = p.indexOf('?');
        if (q >= 0) p = p.substring(0, q);
        int h = p.indexOf('#');
        if (h >= 0) p = p.substring(0, h);
        p = percentDecode(p);
        while (p.startsWith("/")) p = p.substring(1);
        if (p.length() == 0) p = "index.html";
        // Path safety: no escapes out of the assets root.
        if (p.contains("..") || p.contains("\\")) return null;
        // Vite base "/assets/" second segment -> already in asset-root space.
        if (p.startsWith("assets/")) p = p.substring("assets/".length());
        while (p.endsWith("/")) p = p.substring(0, p.length() - 1);
        if (p.length() == 0) p = "index.html";
        return p;
    }

    private static String percentDecode(String s) {
        int n = s.length();
        if (n == 0 || s.indexOf('%') < 0) return s;
        StringBuilder sb = new StringBuilder(n);
        for (int i = 0; i < n; i++) {
            char c = s.charAt(i);
            if (c == '%' && i + 2 < n) {
                int hi = Character.digit(s.charAt(i + 1), 16);
                int lo = Character.digit(s.charAt(i + 2), 16);
                if (hi >= 0 && lo >= 0) {
                    sb.append((char) ((hi << 4) | lo));
                    i += 2;
                    continue;
                }
            }
            sb.append(c);
        }
        return sb.toString();
    }

    /** Reads a whole asset into memory; returns null when the asset is absent. */
    private byte[] readAsset(String path) {
        if (path == null || path.length() == 0) return null;
        InputStream is = null;
        try {
            is = assets.open(path);
            ByteArrayOutputStream buffer = new ByteArrayOutputStream(32 * 1024);
            byte[] chunk = new byte[16 * 1024];
            int read;
            while ((read = is.read(chunk)) != -1) buffer.write(chunk, 0, read);
            return buffer.toByteArray();
        } catch (IOException notPresent) {
            return null;
        } finally {
            if (is != null) try { is.close(); } catch (IOException ignored) {}
        }
    }

    private static String guessMime(String path) {
        String p = path.toLowerCase();
        if (p.endsWith(".html")) return "text/html";
        if (p.endsWith(".css")) return "text/css";
        if (p.endsWith(".mjs")) return "text/javascript";
        if (p.endsWith(".js")) return "text/javascript";
        if (p.endsWith(".json")) return "application/json";
        if (p.endsWith(".svg")) return "image/svg+xml";
        if (p.endsWith(".png")) return "image/png";
        if (p.endsWith(".jpg") || p.endsWith(".jpeg")) return "image/jpeg";
        if (p.endsWith(".gif")) return "image/gif";
        if (p.endsWith(".webp")) return "image/webp";
        if (p.endsWith(".avif")) return "image/avif";
        if (p.endsWith(".ico")) return "image/x-icon";
        if (p.endsWith(".woff2")) return "font/woff2";
        if (p.endsWith(".woff")) return "font/woff";
        return "application/octet-stream";
    }

}
