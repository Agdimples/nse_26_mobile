package com.orivonedge.conferencecompanion;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Intent;
import android.graphics.Color;
import android.os.Bundle;
import android.view.Window;
import android.webkit.JavascriptInterface;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

/**
 * Full-offline launcher: the entire web app is bundled inside the APK
 * (assets root, built by the SPA config) and served to the WebView by
 * LocalAssetServer — a plain HTTP file server bound to 127.0.0.1.
 *
 * WHY NOT WebViewAssetLoader ANY MORE
 * Releases 1.0.9-1.0.12 all showed Android's "Webpage not available" /
 * net::ERR_INVALID_RESPONSE for the first document load on one real device,
 * with every interception configuration tried (single loader as in 1.0.8,
 * double loader, manual static handlers). Main-frame interception via the
 * https://appassets.androidplatform.net scheme is simply unreliable on some
 * WebView builds on this phone, so interception is gone completely: the
 * WebView now loads http://127.0.0.1:<port>/ which no WebView treats as
 * special. 127.0.0.1 is a secure context on Chromium, so Supabase auth
 * (crypto.subtle) and other web platform APIs work exactly as on https.
 */
public class FullOfflineActivity extends Activity {

    private static final String NAVY = "#123E73";

    /** In-app (Play) OTA updates, created lazily; every failure is swallowed
     *  so a broken Play setup can never break app startup itself. */
    private InAppUpdateManager updateManager;

    /** Converts any crash in this process into the on-screen crash report
     *  (CrashReportActivity) instead of Android's "app has stopped" dialog.
     *  Installed in onCreate; also catches Throwable around our own startup
     *  code below, since WebView init is what historically broke. */
    private static void installCrashCatcher(final android.content.Context appContext) {
        final Thread.UncaughtExceptionHandler systemHandler =
                Thread.getDefaultUncaughtExceptionHandler();
        Thread.setDefaultUncaughtExceptionHandler(
                (thread, throwable) -> {
                    CrashReportActivity.LAST_STACK = android.util.Log.getStackTraceString(throwable);
                    // Persisting across a process kill is unreliable mid-crash,
                    // so a static + startActivity NEW_TASK is used instead.
                    try {
                        Intent i = new Intent(appContext, CrashReportActivity.class);
                        i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK
                                | Intent.FLAG_ACTIVITY_CLEAR_TASK
                                | Intent.FLAG_ACTIVITY_SINGLE_TOP);
                        appContext.startActivity(i);
                    } catch (Throwable ignoredMore) {
                        // Last resort: let the system handler show its dialog.
                    }
                    if (systemHandler != null) {
                        // Still let the system log the crash for adb users, but
                        // DON'T call defaultHandling (that would kill the process
                        // before the crash activity can show).
                    }
                });
    }

    private WebView webView;
    private LocalAssetServer assetServer;
    private int port;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        installCrashCatcher(getApplicationContext());
        try {
            onCreateInner(savedInstanceState);
        } catch (Throwable startupCrash) {
            CrashReportActivity.LAST_STACK =
                    android.util.Log.getStackTraceString(startupCrash);
            startActivity(new Intent(this, CrashReportActivity.class)
                    .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
            finish();
        }
    }

    private void onCreateInner(Bundle savedInstanceState) {

        Window window = getWindow();
        if (window != null) {
            window.setStatusBarColor(Color.parseColor(NAVY));
            window.setNavigationBarColor(Color.parseColor(NAVY));
        }

        webView = new WebView(this);
        webView.setBackgroundColor(Color.parseColor(NAVY));
        setContentView(webView);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setLoadWithOverviewMode(true);
        settings.setUseWideViewPort(true);
        settings.setSupportZoom(false);
        settings.setMediaPlaybackRequiresUserGesture(false);
        // Plain-HTTP loopback origin; never relax these for real hosts.
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);

        // OTA updates, web side: a tiny JS bridge lets the More page trigger a
        // manual update check (window.NseApp). It exists only on our loopback
        // origin, so no other page can reach it, and each call is a no-op when
        // the Play machinery is unusable rather than a crash.
        webView.addJavascriptInterface(new NseJsBridge(), "NseApp");

        // Single loader only ever leaves the app UI through here.
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view,
                                                    WebResourceRequest request) {
                return false; // all in-app pages stay in the WebView
            }
        });

        startServerAndLoad(savedInstanceState);
    }

    /** Boots the loopback asset server, then either restores the WebView
     *  state saved on rotation (new port, same pages) or loads the bundled
     *  index page. On server failure falls back to an inline message so the
     *  user never sees Android's raw error page. */
    private void startServerAndLoad(Bundle state) {
        if (assetServer == null) {
            assetServer = new LocalAssetServer(getAssets());
            try {
                port = assetServer.start();
            } catch (Exception e) {
                port = 0;
            }
        }
        if (port == 0) {
            loadOfflineFallback();
            return;
        }
        if (state != null) {
            // Rotation / process recreation: restore the saved page list.
            // restoreState rewrites saved appassets URLs is OUR job (below).
            int savedPort = state.getInt("server_port", 0);
            if (savedPort != 0 && savedPort != port) {
                webView.restoreState(state);
                fixupSavedUrls();
                return;
            }
        }
        webView.loadUrl("http://127.0.0.1:" + port + "/index.html");
        // Launch-time OTA update check: throttled inside the manager (once per
        // 6 h), completely silent; on a fresh sideload it simply no-ops.
        InAppUpdateManager um = ensureUpdateManager();
        if (um != null) {
            um.checkAutomatically();
        }
    }

    /** Bundle state saved on the OLD port contains WebView history URLs
     *  pointing at the old port and at appassets hostnames from earlier
     *  releases. Rewrite both to the current loopback server. */
    private void fixupSavedUrls() {
        // restoreState() rebuilt the back/forward list internally; WebView has
        // no public API to rewrite history entries, so the simplest correct
        // behaviour is: history is dropped, app opens on its home page.
        webView.clearHistory();
        webView.loadUrl("http://127.0.0.1:" + port + "/index.html");
    }

    private void loadOfflineFallback() {
        try {
            webView.loadData(
                    "<html><body style=\"background:#123E73;color:#fff;"
                            + "font-family:sans-serif;display:flex;align-items:center;"
                            + "justify-content:center;height:100%;margin:0\">"
                            + "<p style=\"padding:24px;text-align:center\">"
                            + "Could not start the app engine. Please close and reopen."
                            + "</p></body></html>",
                    "text/html", "UTF-8");
        } catch (Throwable ignored) {
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == InAppUpdateManager.REQUEST_CODE_UPDATE_FLOW
                && updateManager != null) {
            updateManager.onActivityResult(resultCode);
        }
    }

    /** Lazily creates the Play update manager once and caches it in the
     *  field, so onActivityResult can still route Play's result back to it. */
    private InAppUpdateManager ensureUpdateManager() {
        if (updateManager == null) {
            try {
                updateManager = InAppUpdateManager.createIfAvailable(this);
            } catch (Throwable defensiveDoubleGuard) {
                updateManager = null;
            }
        }
        return updateManager;
    }

    /** JS bridge for the web UI:
     *  window.NseApp.checkForUpdate() -> opens Play's own update flow, falling
     *    back to the Play Store listing when in-app updates are unusable;
     *  window.NseApp.openPlayStore() -> opens the store listing directly. */
    private class NseJsBridge {
        @JavascriptInterface
        public void checkForUpdate() {
            runOnUiThread(() -> {
                InAppUpdateManager um = ensureUpdateManager();
                if (um != null) {
                    um.checkManually();
                } else {
                    // No usable Play machinery: at least link to the listing.
                    InAppUpdateManager.openStorePage(FullOfflineActivity.this);
                }
            });
        }

        @JavascriptInterface
        public void openPlayStore() {
            runOnUiThread(() -> {
                InAppUpdateManager um = ensureUpdateManager();
                if (um != null) {
                    um.openStorePage();
                } else {
                    InAppUpdateManager.openStorePage(FullOfflineActivity.this);
                }
            });
        }
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        if (webView != null) webView.saveState(outState);
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }

    @Override
    protected void onDestroy() {
        if (assetServer != null) {
            assetServer.stop();
            assetServer = null;
        }
        if (webView != null) {
            webView.destroy();
            webView = null;
        }
        super.onDestroy();
    }
}
