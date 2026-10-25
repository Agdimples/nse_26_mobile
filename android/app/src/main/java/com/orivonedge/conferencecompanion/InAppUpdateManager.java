package com.orivonedge.conferencecompanion;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;

import com.google.android.play.core.appupdate.AppUpdateInfo;
import com.google.android.play.core.appupdate.AppUpdateManager;
import com.google.android.play.core.appupdate.AppUpdateManagerFactory;
import com.google.android.play.core.install.InstallState;
import com.google.android.play.core.install.InstallStateUpdatedListener;
import com.google.android.play.core.install.model.AppUpdateType;
import com.google.android.play.core.install.model.InstallStatus;
import com.google.android.play.core.install.model.UpdateAvailability;
import com.google.android.gms.tasks.OnFailureListener;
import com.google.android.gms.tasks.OnSuccessListener;
import com.google.android.gms.tasks.Task;

/**
 * Google Play In-App Updates — OTA updates carried out inside the app.
 *
 * On each launch (and on demand from the web UI through the NseApp JS bridge)
 * this asks the Play Store whether a newer bundle exists for this app. The
 * update is downloaded and installed by Play's own machinery — no custom
 * download code, nothing sideloaded, nothing that breaks Play policy:
 *
 *  - FLEXIBLE updates: a dismissible Play sheet; once the download finishes
 *    we trigger completeUpdate(), which restarts the app on the new version
 *    the moment the user accepts.
 *  - IMMEDIATE updates: used only when Play marks the update as forced
 *    (high priority / rollback), so critical fixes cannot be dismissed.
 *
 * On sideloaded test APKs, devices without the Play Store, and offline
 * devices Play simply reports UPDATE_NOT_AVAILABLE or the check task fails
 * — both are swallowed, so installs behave exactly as before this feature.
 */
public class InAppUpdateManager {

    /** Matches the onActivityResult routing in FullOfflineActivity. */
    public static final int REQUEST_CODE_UPDATE_FLOW = 7781;

    /** How often a launch silently checks Play for available updates. */
    private static final long MIN_AUTO_INTERVAL_MS = 6L * 60 * 60 * 1000; // 6 h

    /** Priority (UpdatePriority) at which Play considers an update forced. */
    private static final int FORCED_PRIORITY_THRESHOLD = 5;

    private static final String PREFS_FILE = "app_updates";
    private static final String LAST_AUTO_CHECK = "last_auto_check";

    private final Activity activity;
    private final AppUpdateManager playManager;
    private final SharedPreferences prefs;

    private boolean listenerRegistered;
    private boolean flowActive;

    /** Private: use {@link #createIfAvailable}, which survives broken or
     *  missing Play services by returning null instead of crashing. */
    private InAppUpdateManager(Activity activity) {
        this.activity = activity;
        this.playManager = AppUpdateManagerFactory.create(activity);
        this.prefs = activity.getSharedPreferences(PREFS_FILE, Activity.MODE_PRIVATE);
    }

    /** Quietly scans on the next 6h tick; returns a ready instance or null if the Play machinery
     *  is broken or missing. */
    public static InAppUpdateManager createIfAvailable(Activity activity) {
        try {
            return new InAppUpdateManager(activity);
        } catch (Throwable noPlay) {
            return null;
        }
    }

    /** Launch-time check: throttled to once per 6 h, completely silent. */
    public void checkAutomatically() {
        maybeCheck(false);
    }

    /** Manual entry point from the web UI (More → App updates). */
    public void checkManually() {
        maybeCheck(true);
    }

    private void maybeCheck(boolean manual) {
        if (flowActive) return;
        final long now = System.currentTimeMillis();
        if (!manual && now - prefs.getLong(LAST_AUTO_CHECK, 0L) < MIN_AUTO_INTERVAL_MS) {
            return;
        }
        prefs.edit().putLong(LAST_AUTO_CHECK, now).apply();

        Task<AppUpdateInfo> infoTask;
        try {
            infoTask = playManager.getAppUpdateInfo();
        } catch (Throwable noCache) {
            return;
        }
        infoTask
                .addOnSuccessListener(new OnSuccessListener<AppUpdateInfo>() {
                    @Override
                    public void onSuccess(AppUpdateInfo info) {
                        runSilently(() -> handleUpdateInfo(info));
                    }
                })
                .addOnFailureListener(new OnFailureListener() {
                    @Override
                    public void onFailure(Exception e) {
                        // No Play Store / device not signed in: always benign.
                    }
                });
    }

    private void handleUpdateInfo(AppUpdateInfo info) {
        final int availability = info.updateAvailability();
        if (availability != UpdateAvailability.UPDATE_AVAILABLE
                && availability != UpdateAvailability.DEVELOPER_TRIGGERED_UPDATE_IN_PROGRESS) {
            return;
        }

        // Resume a previously started IMMEDIATE session if we got cut mid-flow.
        if (availability == UpdateAvailability.DEVELOPER_TRIGGERED_UPDATE_IN_PROGRESS
                && info.isUpdateTypeAllowed(AppUpdateType.IMMEDIATE)) {
            startFlow(info, AppUpdateType.IMMEDIATE);
            return;
        }

        // A FLEXIBLE update fully downloaded on an earlier launch: finish it.
        if (info.installStatus() == InstallStatus.DOWNLOADED) {
            try {
                playManager.completeUpdate();
                return;
            } catch (Throwable interruptedRestart) {
                // Fall through and just offer the update again.
            }
        }

        final boolean forced = info.updatePriority() >= FORCED_PRIORITY_THRESHOLD;
        if (forced && info.isUpdateTypeAllowed(AppUpdateType.IMMEDIATE)) {
            startFlow(info, AppUpdateType.IMMEDIATE);
        } else if (info.isUpdateTypeAllowed(AppUpdateType.FLEXIBLE)) {
            startFlow(info, AppUpdateType.FLEXIBLE);
        }
    }

    @SuppressLint("WrongConstant")
    private void startFlow(AppUpdateInfo info, @AppUpdateType int type) {
        flowActive = true;
        registerDownloadListener();
        try {
            playManager.startUpdateFlowForResult(info, type, activity, REQUEST_CODE_UPDATE_FLOW);
        } catch (Throwable refusedFlow) {
            flowActive = false;
        }
    }

    /** Forward the host activity's onActivityResult here; Play sheets close
     *  with RESULT_CANCELED when dismissed and RESULT_OK when accepted —
     *  flexible downloads keep running in the background either way. */
    public void onActivityResult(int resultCode) {
        flowActive = false;
    }

    private void registerDownloadListener() {
        if (listenerRegistered) return;
        listenerRegistered = true;
        playManager.registerListener(new InstallStateUpdatedListener() {
            @Override
            public void onStateUpdate(InstallState state) {
                if (state.installStatus() == InstallStatus.DOWNLOADED) {
                    // The new version is fully on-device. completeUpdate()
                    // closes the app and relaunches on the new version.
                    runSilently(() -> playManager.completeUpdate());
                }
            }
        });
    }

    /** Leaves the app for the Play Store listing page, whose Update button
     *  is the fallback path when the in-app machinery is not usable. */
    public void openStorePage() {
        openStorePage(activity);
    }

    /** Static twin so callers without a manager instance can still link out. */
    public static void openStorePage(android.content.Context context) {
        final String packageName = context.getPackageName();
        try {
            context.startActivity(new Intent(Intent.ACTION_VIEW,
                    Uri.parse("market://details?id=" + packageName)));
            return;
        } catch (Throwable noPlayStoreApp) {
        }
        try {
            context.startActivity(new Intent(Intent.ACTION_VIEW,
                    Uri.parse("https://play.google.com/store/apps/details?id="
                            + packageName)));
        } catch (Throwable noBrowser) {
        }
    }

    /** Guards errors inside error handlers: anything thrown by the updater
     *  itself is caught and dropped — it can never bring the UI down. */
    private static void runSilently(Runnable r) {
        try {
            r.run();
        } catch (Throwable ignored) {
        }
    }
}
