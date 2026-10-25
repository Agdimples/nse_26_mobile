package com.orivonedge.conferencecompanion;

import android.app.Activity;
import android.graphics.Color;
import android.graphics.Typeface;
import android.os.Bundle;
import android.view.Gravity;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;

/**
 * Crash reporter: shows the exact Java/WebView error that killed the app,
 * on screen, in plain text. Screenshot of this screen == the logcat stack a
 * developer would need, so no PC is required to diagnose a device crash.
 *
 * Reached two ways:
 *  - Thread.setDefaultUncaughtExceptionHandler set by FullOfflineActivity.
 *  - FullOfflineActivity catching a Throwable directly in onCreate.
 */
public class CrashReportActivity extends Activity {

    /** Freshly crashing process sets this before starting this activity. */
    public static volatile String LAST_STACK = "";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setBackgroundColor(Color.parseColor("#123E73"));
        int pad = (int) (16 * getResources().getDisplayMetrics().density);
        root.setPadding(pad, pad, pad, pad);

        TextView title = new TextView(this);
        title.setText("The app hit an error — please screenshot this screen");
        title.setTextColor(Color.WHITE);
        title.setTextSize(16);
        title.setTypeface(Typeface.DEFAULT_BOLD);
        title.setPadding(0, 0, 0, pad);
        root.addView(title);

        TextView text = new TextView(this);
        String stack = LAST_STACK == null || LAST_STACK.length() == 0
                ? "(no stack captured)" : LAST_STACK;
        text.setText(stack);
        text.setTextColor(Color.parseColor("#CDE0F5"));
        text.setTextSize(11);
        text.setTypeface(Typeface.MONOSPACE);
        text.setGravity(Gravity.TOP);
        root.addView(text,
                new LinearLayout.LayoutParams(-1, -1, 1f));

        Button restart = new Button(this);
        restart.setText("Restart the app");
        restart.setOnClickListener(v -> {
            LAST_STACK = "";
            startActivity(new android.content.Intent(
                    getApplicationContext(), FullOfflineActivity.class)
                    .addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK
                            | android.content.Intent.FLAG_ACTIVITY_CLEAR_TASK));
            finish();
        });
        root.addView(restart);

        setSupportActionBarLikeTitle(this);
        ScrollView scroller = new ScrollView(this);
        scroller.setBackgroundColor(Color.parseColor("#123E73"));
        scroller.addView(root);
        setContentView(scroller);
    }

    @SuppressWarnings("deprecation")
    private static void setSupportActionBarLikeTitle(Activity a) {
        // Leave the stock title bar; crash screens don't need custom chrome.
    }
}
