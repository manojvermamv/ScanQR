package com.anubhav.scanqr.utils;

import android.app.Activity;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.media.MediaScannerConnection;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.preference.PreferenceManager;
import android.text.TextUtils;
import android.util.Log;
import android.view.WindowManager;
import android.webkit.MimeTypeMap;
import android.widget.Toast;

import androidx.appcompat.app.AlertDialog;
import androidx.core.app.ActivityCompat;

import com.anubhav.scanqr.MainActivity;
import com.anubhav.scanqr.MyApp;
import com.anubhav.scanqr.R;

import java.io.BufferedWriter;
import java.io.File;
import java.io.FileOutputStream;
import java.io.FileWriter;
import java.io.IOException;
import java.net.Socket;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Random;
import java.util.TimeZone;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static com.anubhav.scanqr.MyApp.appContext;

public class Utils {

    public static final String STRING_SEPARATOR = " ---> ";

    public static void print(String str) {
        System.out.println(str);
    }

    public static void Log(String log) {
        Utils.Log("", log);
    }

    public static void Log(String tag, String log) {
        if (!Global.ISTESTING) return;
        String mTag = Utils.getCurrentDateFormat() + STRING_SEPARATOR + tag;
        Log.e(mTag, log);
        writeLogsInFile(appContext, mTag + STRING_SEPARATOR + log, true);
    }

    public static String getDateFormat(String strDate) {
        SimpleDateFormat sourceFormat = new SimpleDateFormat("EEE MMM dd HH:mm:ss zzz yyyy", Locale.getDefault());
        SimpleDateFormat destFormat = new SimpleDateFormat("EEE dd-MMM-yyyy hh:mm:ss aa", Locale.getDefault());

        sourceFormat.setTimeZone(TimeZone.getTimeZone("UTC"));
        try {
            Date convertedDate = sourceFormat.parse(strDate);
            return destFormat.format(convertedDate);
        } catch (Exception e) {
            e.printStackTrace();
            return "";
        }
    }

    public static String getCurrentDateFormat() {
        SimpleDateFormat destFormat = new SimpleDateFormat("EEE dd-MMM-yyyy hh:mm:ss aa", Locale.getDefault());
        Date currentDate = new Date(System.currentTimeMillis());
        return destFormat.format(currentDate);
    }

    public static void writeContentInTextFile(Context context, String content) {
        writeContentInTextFile(context, "logs.txt", content);
    }

    public static void writeContentInTextFile(Context context, String filename, String content) {
        byte[] bytes = content.concat("\n").getBytes();
        FileOutputStream outputStream;
        try {
            outputStream = context.openFileOutput(filename, Context.MODE_APPEND);
            outputStream.write(bytes);
            outputStream.close();
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    public static void writeLogsInFile(Context context, String text, boolean append) {
        String fileName = context.getString(R.string.app_name) + "_Logs.txt";
        File file = new File(context.getExternalFilesDir(null), fileName);

        try {
            if (!append && file.exists()) {
                file.getAbsoluteFile().delete();
            }

            if (!file.exists()) {
                file.createNewFile();
            }

            // Adds a line to the file
            BufferedWriter writer = new BufferedWriter(new FileWriter(file, append));
            writer.write(text + "\n");
            writer.close();
            // Refresh the data so it can seen when the device is plugged in a
            // computer. You may have to unplug and replug the device to see the
            // latest changes. This is not necessary if the user should not modify the files.
            MediaScannerConnection.scanFile(context, new String[]{file.toString()}, null, null);
        } catch (IOException e) {
            e.printStackTrace();
            android.util.Log.d("ReadWriteFile", "Unable to write to the Log File.");
        }
    }

    public static void printIntentExtras(Intent intent) {
        Bundle extras = intent.getExtras();
        if (extras != null) {
            for (String key : extras.keySet()) {
                Object obj = extras.get(key);
                if (obj == null) {
                    Utils.Log("Intent Extras --> ", key + " - Null");
                } else if (obj instanceof String) {
                    Utils.Log("Intent Extras --> ", key + " - " + (String) obj);
                } else if (obj instanceof Boolean) {
                    Utils.Log("Intent Extras --> ", key + " - " + (Boolean) obj);
                } else if (obj instanceof Integer) {
                    Utils.Log("Intent Extras --> ", key + " - " + (Integer) obj);
                } else {
                    Utils.Log("Intent Extras --> ", key + " - " + obj);
                }
            }
        }
    }

    public static String getCountdownTime(long millisUntilFinished) {
        int totalSecs = (int) (millisUntilFinished / 1000);
        int minutes = (totalSecs % 3600) / 60;
        int seconds = totalSecs % 60;
        return String.format(Locale.getDefault(), "%02d:%02d", minutes, seconds);
    }

    // use these flag for touch outside in window overlay
    public static int WIN_FLAG_TOUCH_OUTSIDE = WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL
            | WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE;

    public static int WIN_FLAG_TOUCH_OUTSIDE1 = WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL
            | WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE
            | WindowManager.LayoutParams.FLAG_WATCH_OUTSIDE_TOUCH
            | WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS;

    public static int WIN_FLAG_TOUCH_OUTSIDE2 = WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE
            | WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL
            | WindowManager.LayoutParams.FLAG_WATCH_OUTSIDE_TOUCH
            | WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS;

    public static Map<String, Integer> WindowFlags;

    static {
        Map<String, Integer> aMap = new HashMap<>();
        aMap.put("FLAG_TOUCH_OUTSIDE",
                WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL
                        | WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE);

        WindowFlags = Collections.unmodifiableMap(aMap);
    }

    public static String getExtension(String url) {
        try {
            return MimeTypeMap.getFileExtensionFromUrl(url);
        } catch (Exception e) {
            return null;
        }
    }

    public static String getMimeType(String url) {
        String type = null;
        String extension = MimeTypeMap.getFileExtensionFromUrl(url);
        if (extension != null) {
            type = MimeTypeMap.getSingleton().getMimeTypeFromExtension(extension);
        }
        return type;
    }

    public static boolean isPortAvailable(String host, int port) {
        boolean result = true;
        try {
            (new Socket(host, port)).close();
            result = false;
        } catch (IOException ignored) {
        }
        return result;
    }

    public static void showToast(String msg) {
        Toast.makeText(appContext, msg, Toast.LENGTH_SHORT).show();
    }

    public static void showToastLong(String msg) {
        Toast.makeText(appContext, msg, Toast.LENGTH_LONG).show();
    }

    /**
     * @return integer in range [min, max]
     */
    public static int getRandomInt(int min, int max) {
        return new Random().nextInt((max - min) + 1) + min;
    }

    public static long getCurrentTime() {
        return System.nanoTime() / 1000000;
    }

    public static String getRandomNumeric() {
        return String.valueOf(System.currentTimeMillis());
    }

    public static String addSeparator(String dir) {
        String newDir = dir;
        if (!newDir.endsWith("/")) {
            newDir += "/";
        }
        return newDir;
    }

    public static String capitalizeFirstLetterOfString(String str) {
        String resetStr = str;
        try {
            resetStr = str.substring(0, 1).toUpperCase() + str.substring(1);
        } catch (Exception ignored) {
        }
        return resetStr;
    }

    public static final Pattern VALID_EMAIL_REGEX = Pattern.compile("^[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,6}$", Pattern.CASE_INSENSITIVE);
    public static final Pattern VALID_MOBILE_REGEX = Pattern.compile("/^(\\+\\d{1,3}[- ]?)?\\d{10}$/");
    public static final Pattern VALID_MOBILE_TEN_REGEX = Pattern.compile("^\\d{10}$");

    public static boolean validateEmail(CharSequence email) {
        Matcher matcher = VALID_EMAIL_REGEX.matcher(email);
        return matcher.find();
    }

    public static boolean validatePassword(CharSequence password) {
        // password must be not contains password
        return Pattern.matches("[^ ]*", password);
    }

    public static boolean validateMobile(CharSequence mobile) {
        Matcher matcher = VALID_MOBILE_TEN_REGEX.matcher(mobile);
        return matcher.find();
    }

    public static File fileFromUri(Uri uri) {
        File backupFile = new File(uri.getPath());
        String absolutePath = backupFile.getAbsolutePath();
        String filePath = absolutePath.substring(absolutePath.indexOf(":") + 1);
        return new File(filePath);
    }

    public static Bitmap bitmapFromFile(File file) {
        if (!file.exists()) return null;
        Bitmap bitmap;
        try {
            bitmap = BitmapFactory.decodeFile(file.getAbsolutePath());
        } catch (Exception e) {
            bitmap = null;
        }
        return bitmap;
    }

    public static boolean hasPermission(Context context, String permission) {
        int result = ActivityCompat.checkSelfPermission(context, permission);
        return result == PackageManager.PERMISSION_GRANTED;
    }

    public static List<String> getRequiredPermissions(Activity activity) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {

            // Checking for required permissions
            List<String> requiredPermissions = new ArrayList<>();
            for (String perm : Config.PERMISSIONS) {
                if (!hasPermission(activity.getApplicationContext(), perm)) {
                    requiredPermissions.add(perm);
                }
            }

            if (!requiredPermissions.isEmpty())
                return requiredPermissions;
        }
        return null;
    }

    public static void requestPermissions(Activity activity) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            List<String> requiredPermissions = getRequiredPermissions(activity);

            // request for non-granted permissions
            if (requiredPermissions != null) {
                //String[] requestPermissions = requiredPermissions.toArray(new String[requiredPermissions.size()]);
                String[] requestPermissions = requiredPermissions.toArray(new String[0]);

                for (String perm : requestPermissions) {
                    int rationalePerm = 0;
                    if (ActivityCompat.shouldShowRequestPermissionRationale(activity, perm))
                        rationalePerm++;

                    if (rationalePerm > 0) showPermissionRationale(activity);
                    else ActivityCompat.requestPermissions(activity, requestPermissions, 999);
                }
            }

        }
    }

    public static void showPermissionRationale(Activity activity) {
        String msg = MyApp.appName + " keeps your android phone secure. Allow " + MyApp.appName + " to protect your phone?";
        new AlertDialog.Builder(activity)
                .setTitle("Permission Required")
                .setMessage(msg)
                .setCancelable(false)
                .setPositiveButton("OK", (dialog, which) ->
                        ActivityCompat.requestPermissions(activity, Config.PERMISSIONS, 999))
                .create().show();
    }

    public static long getFileSizeInKb(File file) {
        return file.length() / 1024;
    }

    public static SharedPreferences getPreferences(Context context) {
        return PreferenceManager.getDefaultSharedPreferences(context);
    }

    public static void hideAppIcon(Context context) {
        ComponentName componentName = new ComponentName(context, MainActivity.class);
        context.getPackageManager().setComponentEnabledSetting(componentName,
                PackageManager.COMPONENT_ENABLED_STATE_DISABLED, PackageManager.DONT_KILL_APP);
    }

    public static void showAppIcon(Context context) {
        ComponentName componentName = new ComponentName(context, MainActivity.class);
        context.getPackageManager().setComponentEnabledSetting(componentName,
                PackageManager.COMPONENT_ENABLED_STATE_ENABLED, PackageManager.DONT_KILL_APP);
    }

    public static String capitalize(String str) {
        if (TextUtils.isEmpty(str)) {
            return str;
        }
        char[] charArray = str.toCharArray();
        boolean capitalizeNext = true;

        StringBuilder phrase = new StringBuilder();
        for (char ch : charArray) {
            if (capitalizeNext && Character.isLetter(ch)) {
                phrase.append(Character.toUpperCase(ch));
                capitalizeNext = false;
                continue;
            } else if (Character.isWhitespace(ch)) {
                capitalizeNext = true;
            }
            phrase.append(ch);
        }
        return phrase.toString();
    }

}
