package com.anubhav.scanqr;

import android.app.AlarmManager;
import android.app.Application;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;

import androidx.annotation.NonNull;
import androidx.multidex.MultiDex;

import java.io.PrintWriter;
import java.io.StringWriter;

public class MyApp extends Application {

    public static String appName;
    public static Context appContext;
    public static String packageName;
    public static String TAG = MyApp.class.getSimpleName();
    private Thread.UncaughtExceptionHandler uncaughtExceptionHandler;

    @Override
    protected void attachBaseContext(Context base) {
        super.attachBaseContext(base);
        MultiDex.install(this);
    }

    @Override
    public void onCreate() {
        this.uncaughtExceptionHandler = Thread.getDefaultUncaughtExceptionHandler();
        Thread.setDefaultUncaughtExceptionHandler(new Thread.UncaughtExceptionHandler() {
            @Override
            public void uncaughtException(@NonNull Thread thread, @NonNull Throwable ex) {
                Intent intent = new Intent(getApplicationContext(), DebugActivity.class);
                intent.setFlags(Intent.FLAG_ACTIVITY_CLEAR_TASK);

                intent.putExtra("error", getStackTrace(ex));

                PendingIntent pendingIntent = PendingIntent.getActivity(getApplicationContext(), 11111, intent, PendingIntent.FLAG_ONE_SHOT);

                AlarmManager am = (AlarmManager) getSystemService(Context.ALARM_SERVICE);
                am.set(AlarmManager.ELAPSED_REALTIME_WAKEUP, 1000, pendingIntent);

                android.os.Process.killProcess(android.os.Process.myPid());
                System.exit(2);

                uncaughtExceptionHandler.uncaughtException(thread, ex);
            }
        });

        super.onCreate();
        appContext = this;
        packageName = getPackageName();
        appName = getString(R.string.app_name);
    }

    private String getStackTrace(Throwable th) {
        Exception e = new Exception(th);
        StringWriter result = new StringWriter();
        PrintWriter printWriter = new PrintWriter(result);
        while (th != null) {
            th.printStackTrace(printWriter);
            th = th.getCause();
        }
        String r = result.toString();

        //Uncomment below lines to write logs to local storage when your app crashes
        //Make sure you request storage permissions on devices with API 23+
        /*
        result = new StringWriter();
        printWriter = new PrintWriter(result);
        e.printStackTrace(printWriter);
        String r2 = result.toString();
        FileUtil.writeFile(FileUtil.getExternalStorageDir() + "/logcat.txt", r2);*/
        return r;
    }

}