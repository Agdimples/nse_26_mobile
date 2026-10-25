package com.orivonedge.conferencecompanion;

import android.content.Context;
import android.net.Uri;

import androidx.browser.customtabs.CustomTabsCallback;
import androidx.browser.trusted.TrustedWebActivityIntentBuilder;

import com.google.androidbrowserhelper.trusted.LauncherActivity;
import com.google.androidbrowserhelper.trusted.TwaLauncher;
import com.google.androidbrowserhelper.trusted.splashscreens.SplashScreenStrategy;

/**
 * The stock LauncherActivity installs a QualityEnforcer callback: if Chrome
 * reports a quality violation ("quality_enforcement.crash") — most commonly a
 * verified-origin page that could not be displayed, e.g. because the network
 * is slow, offline, or the site is momentarily unreachable — the helper
 * deliberately throws an uncaught RuntimeException on the main thread, which
 * Android shows as "My Conference Companion has stopped".
 *
 * Verified in the androidbrowserhelper 2.7.3 bytecode, the QualityEnforcer is
 * created in TWO places, and both must be neutralised:
 *   1. LauncherActivity.getCustomTabsCallback() — fixed here by returning a
 *      plain callback.
 *   2. TwaLauncher.launch(Uri) — it constructs "new QualityEnforcer()" itself.
 *      No code path in this app currently calls launch(Uri), but we route it
 *      through the safe callback too so any future call cannot reintroduce
 *      the deliberate-crash behaviour.
 *
 * For a conference app used on flaky event Wi-Fi and mobile data, a failed
 * load must never kill the app: the browser shows its own error/offline page
 * instead, and the app survives.
 */
public class NoCrashLauncherActivity extends LauncherActivity {
    private final CustomTabsCallback mCallback = new CustomTabsCallback() {};

    @Override
    public CustomTabsCallback getCustomTabsCallback() {
        // Plain callback: no QualityEnforcer, no deliberate crash on
        // navigation interruption.
        return mCallback;
    }

    @Override
    protected TwaLauncher createTwaLauncher() {
        return new NoCrashTwaLauncher(this);
    }

    private final class NoCrashTwaLauncher extends TwaLauncher {
        NoCrashTwaLauncher(Context context) {
            super(context);
        }

        /** Route the stock launch(Uri) — which hard-codes QualityEnforcer —
         *  through the safe callback instead. */
        @Override
        public void launch(Uri url) {
            launch(new TrustedWebActivityIntentBuilder(url), mCallback, null,
                    null);
        }

        /** Whatever the caller passes, the session always gets the plain
         *  callback, never a QualityEnforcer. */
        @Override
        public void launch(TrustedWebActivityIntentBuilder builder,
                           CustomTabsCallback callback,
                           SplashScreenStrategy splashScreenStrategy,
                           java.lang.Runnable onLaunch) {
            super.launch(builder, mCallback, splashScreenStrategy, onLaunch);
        }
    }
}
