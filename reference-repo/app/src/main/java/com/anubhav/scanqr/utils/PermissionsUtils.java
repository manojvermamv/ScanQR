package com.anubhav.scanqr.utils;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.PowerManager;
import android.provider.Settings;

import com.anubhav.commonutility.CustomToast;

public class PermissionsUtils {

    public static void enableDozeMod(Context context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            Intent intent = new Intent();
            String packageName = context.getPackageName();
            PowerManager pm = (PowerManager) context.getSystemService(Context.POWER_SERVICE);
            if (!pm.isIgnoringBatteryOptimizations(packageName)) {
                intent.setAction(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS);
                intent.setData(Uri.parse("package:" + packageName));
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                context.startActivity(intent);
            }
        }
    }

    public static void goToAppSettings(Context context) {
        Intent intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
        Uri uri = Uri.fromParts("package", context.getPackageName(), null);
        intent.setData(uri);
        ((Activity) context).startActivityForResult(intent, 1221);
        CustomToast.showCustomToast(context, "Go to Permissions to grant");
    }

    public static boolean requestForUnknownAppInstall(Context context) {
        boolean isPermissionGranted = true;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            isPermissionGranted = context.getPackageManager().canRequestPackageInstalls();
            if (!isPermissionGranted) {
                Intent unKnownSourceIntent = new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES).setData(Uri.parse(String.format("package:%s", context.getPackageName())));
                ((Activity) context).startActivityForResult(unKnownSourceIntent, Global.UNKNOWN_PACKAGE_INTENT_REQUEST_CODE);
            }
        }
        return isPermissionGranted;
    }

}