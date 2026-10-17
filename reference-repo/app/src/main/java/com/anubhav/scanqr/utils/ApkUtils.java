package com.anubhav.scanqr.utils;

import android.app.Activity;
import android.app.PendingIntent;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageInfo;
import android.content.pm.PackageInstaller;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.drawable.Drawable;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import android.text.TextUtils;
import android.util.Log;

import androidx.core.content.FileProvider;
import androidx.core.content.pm.ShortcutInfoCompat;
import androidx.core.content.pm.ShortcutManagerCompat;
import androidx.core.graphics.drawable.IconCompat;

import com.anubhav.scanqr.MyApp;
import com.anubhav.scanqr.database.common.InstalledAppsModel;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

public class ApkUtils {

    public static String TAG = ApkUtils.class.getSimpleName();

    public static boolean isSystemPackage(ResolveInfo ri) {
        return (ri.activityInfo.applicationInfo.flags & ApplicationInfo.FLAG_SYSTEM) != 0;
    }

    public static void checkIsApk(String fileName) throws Exception {
        if (TextUtils.isEmpty(fileName)) {
            throw new Exception("apk file is null!");
        } else if (!fileName.toLowerCase().endsWith(".apk")) {
            throw new Exception("this is not a apk file check file path!");
        }
    }

    public static boolean launchApplication(Context context, String packageName) {
        try {
            Intent intent = context.getPackageManager().getLaunchIntentForPackage(packageName);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            context.startActivity(intent);
            return true;
        } catch (Exception e) {
            Utils.Log(TAG, e.toString());
            e.printStackTrace();
            return false;
        }
    }

    public static String getApkFileName(Context context, String apkPath) {
        try {
            PackageManager pm = context.getPackageManager();
            PackageInfo pi = pm.getPackageArchiveInfo(apkPath, 0);
            pi.applicationInfo.sourceDir = apkPath;
            pi.applicationInfo.publicSourceDir = apkPath;

            return pi.applicationInfo.loadLabel(pm).toString();
        } catch (Exception e) {
            Utils.Log(TAG, e.toString());
            return null;
        }
    }

    public static Drawable getApkFileIcon(Context context, String apkPath) {
        try {
            PackageManager pm = context.getPackageManager();
            PackageInfo pi = pm.getPackageArchiveInfo(apkPath, 0);
            pi.applicationInfo.sourceDir = apkPath;
            pi.applicationInfo.publicSourceDir = apkPath;

            return pi.applicationInfo.loadIcon(pm);
        } catch (Exception e) {
            Utils.Log(TAG, e.toString());
            return null;
        }
    }

    public static String getApkPackageName(Context context, String apkPath) {
        try {
            PackageManager pm = context.getPackageManager();
            PackageInfo pi = pm.getPackageArchiveInfo(apkPath, PackageManager.GET_ACTIVITIES);
            pi.applicationInfo.sourceDir = apkPath;
            pi.applicationInfo.publicSourceDir = apkPath;

            return pi.applicationInfo.packageName;
        } catch (Exception e) {
            Utils.Log(TAG, e.toString());
            return null;
        }
    }

    public static String getApkLauncherActivityName(Context context, String apkPath) {
        try {
            PackageManager pm = context.getPackageManager();
            PackageInfo pi = pm.getPackageArchiveInfo(apkPath, PackageManager.GET_ACTIVITIES);
            pi.applicationInfo.sourceDir = apkPath;
            pi.applicationInfo.publicSourceDir = apkPath;

            String pkgName = pi.applicationInfo.packageName;
            //ActivityInfo[] activities = pi.activities;

            return getLauncherActivityName(context, pkgName);
        } catch (Exception e) {
            Utils.Log(TAG, e.toString());
            return null;
        }
    }

    public static String getLauncherActivityName(Context context, String pkgName) {
        String activityName = "";
        PackageManager pm = context.getPackageManager();
        Intent intent = pm.getLaunchIntentForPackage(pkgName);
        List<ResolveInfo> activityList = pm.queryIntentActivities(intent, 0);
        if (activityList != null) {
            activityName = activityList.get(0).activityInfo.name;
        }
        return activityName;
    }

    public static void installApkNormally(Context context, String apkPath) {
        try {
            File file = new File(apkPath);
            String pkgName = context.getPackageName();
            Uri fileUri;

            if (file.exists()) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    Intent unKnownSourceIntent = new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES).setData(Uri.parse(String.format("package:%s", pkgName)));
                    if (!context.getPackageManager().canRequestPackageInstalls()) {
                        context.startActivity(unKnownSourceIntent);
                    } else {
                        fileUri = FileProvider.getUriForFile(context, pkgName + ".provider", file);
                        Intent intent = new Intent(Intent.ACTION_VIEW, fileUri);
                        intent.putExtra(Intent.EXTRA_NOT_UNKNOWN_SOURCE, true);
                        intent.setDataAndType(fileUri, "application/vnd.android" + ".package-archive");
                        //intent.setFlags(Intent.FLAG_ACTIVITY_CLEAR_TASK | Intent.FLAG_ACTIVITY_NEW_TASK);
                        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                        intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                        context.startActivity(intent);
                    }

                } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                    Intent intent1 = new Intent(Intent.ACTION_INSTALL_PACKAGE);
                    fileUri = FileProvider.getUriForFile(context, pkgName + ".provider", file);
                    context.grantUriPermission(pkgName, fileUri, Intent.FLAG_GRANT_READ_URI_PERMISSION);
                    context.grantUriPermission(pkgName, fileUri, Intent.FLAG_GRANT_WRITE_URI_PERMISSION);
                    intent1.setDataAndType(fileUri, "application/*");
                    intent1.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    intent1.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                    intent1.addFlags(Intent.FLAG_GRANT_WRITE_URI_PERMISSION);
                    context.startActivity(intent1);

                } else {
                    Intent intent = new Intent(Intent.ACTION_VIEW);
                    fileUri = Uri.fromFile(file);
                    intent.setDataAndType(fileUri, "application/vnd.android.package-archive");
                    intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    context.startActivity(intent);

                }
            } else {
                Log.e(TAG, " file " + apkPath + " does not exist");
            }
        } catch (Exception e) {
            Log.e(TAG, "" + e.getMessage());
        }
    }

    public static boolean installApkWithRoot(String apkFilePath) {
        Process installProcess = null;
        int installResult = -1337;

        try {
            installProcess = Runtime.getRuntime().exec("su -c pm install -r " + apkFilePath);
        } catch (IOException e) {
            // Handle IOException the way you like.
            e.printStackTrace();
            Utils.Log(TAG, e.toString());
        }

        if (installProcess != null) {
            try {
                installResult = installProcess.waitFor();
            } catch (InterruptedException e) {
                // Handle InterruptedException the way you like.
                e.printStackTrace();
                Utils.Log(TAG, e.toString());
            }

            // Success!
            return installResult == 0;
        }
        return false;
    }

    public static boolean installApkDirectly(Context context, String apkFilePath) {
        try {
            ApkUtils.checkIsApk(apkFilePath);

            String pkgName = ApkUtils.getApkPackageName(context, apkFilePath);
            String activityName = ApkUtils.getApkLauncherActivityName(context, apkFilePath);
            ComponentName componentName = new ComponentName(pkgName, activityName);

            Intent intent = new Intent(Intent.ACTION_MAIN);
            intent.addCategory(Intent.CATEGORY_LAUNCHER);
            intent.putExtra("info", "somedata");
            intent.setComponent(componentName);

            PackageInstaller packageInstaller = context.getPackageManager().getPackageInstaller();
            PackageInstaller.SessionParams params = new PackageInstaller.SessionParams(PackageInstaller.SessionParams.MODE_FULL_INSTALL);
            params.setAppPackageName(pkgName);

            int sessionId = packageInstaller.createSession(params);
            PackageInstaller.Session session = packageInstaller.openSession(sessionId);
            OutputStream out = session.openWrite("package", 0, -1);

            InputStream in = new FileInputStream(apkFilePath);
            //InputStream in = context.getResources().openRawResource(R.raw.some_apk);
            //InputStream inI.create(webUrl).toURL().openStream(); = UR
            byte[] buffer = new byte[65536];
            int c;
            while ((c = in.read(buffer)) != -1) {
                out.write(buffer, 0, c);
            }
            session.fsync(out);
            in.close();
            out.close();

            Random generator = new Random();
            PendingIntent i = PendingIntent.getActivity(context, generator.nextInt(), intent, PendingIntent.FLAG_UPDATE_CURRENT);
            session.commit(i.getIntentSender());
            return true;
        } catch (Exception e) {
            e.printStackTrace();
            Utils.Log(TAG, e.toString());
            return false;
        }
    }

    public static void uninstallApplication(Context context, String packageName) {
        try {
            Intent intent = new Intent(Intent.ACTION_DELETE);
            intent.setData(Uri.parse("package:" + packageName));
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            context.startActivity(intent);
        } catch (Exception e) {
            Utils.Log(e.toString());
        }
    }

    public static void addShortcut(Context context, String appName, String url, byte[] icon_byte) {
        //File.WriteAllBytes(Android.OS.Environment.ExternalStorageDirectory + "/launcher.jpg", icon_byte);
        try {
            Bitmap bitmap = BitmapFactory.decodeByteArray(icon_byte, 0, icon_byte.length);
            Uri uri = Uri.parse(url);
            Intent intent = new Intent(Intent.ACTION_VIEW, uri);

            //if (Build.VERSION.SDK_INT >= BuildVersionCodes.NMr1) {
            if (Build.VERSION.SDK_INT < Build.VERSION_CODES.KITKAT) {
                if (ShortcutManagerCompat.isRequestPinShortcutSupported(context)) {
                    ShortcutInfoCompat shortcutInfo = new ShortcutInfoCompat.Builder(context, "#1")
                            .setIntent(intent)
                            .setShortLabel(appName)
                            .setIcon(IconCompat.createWithBitmap(bitmap))
                            .build();
                    ShortcutManagerCompat.requestPinShortcut(context, shortcutInfo, null);
                }
            } else {
                Intent installer = new Intent();
                installer.putExtra("android.intent.extra.shortcut.INTENT", intent);
                installer.putExtra("android.intent.extra.shortcut.NAME", appName);
                installer.putExtra("android.intent.extra.shortcut.ICON", bitmap);
                installer.setAction("com.android.launcher.action.INSTALL_SHORTCUT");
                context.sendBroadcast(installer);
            }
            //byte[] myData = MyDataPacker("SHORTCUT", System.Text.Encoding.UTF8.GetBytes("Shortcut add request was successfully sent."));
            //Soketimiz.BeginSend(myData, 0, myData.Length, SocketFlags.None, null, null);
        } catch (Exception e) {
            Utils.Log(e.toString());
        }
    }

    public static void deleteShortcut(Activity activity, String installedShortcut) {
        try {
            Intent shortcut = new Intent("com.android.launcher.action.UNINSTALL_SHORTCUT");
            shortcut.putExtra(Intent.EXTRA_SHORTCUT_NAME, installedShortcut);
            String appClass = activity.getPackageName() + "." + activity.getLocalClassName();
            ComponentName comp = new ComponentName(activity.getPackageName(), appClass);
            shortcut.putExtra(Intent.EXTRA_SHORTCUT_INTENT, new Intent(Intent.ACTION_MAIN).setComponent(comp));
            activity.sendBroadcast(shortcut);
        } catch (Exception e) {
            Utils.Log(e.toString());
        }
    }

    public static List<InstalledAppsModel> getInstalledApps(Context context) {
        PackageManager pm = context.getPackageManager();
        List<InstalledAppsModel> list = new ArrayList<>();

        try {
            List<PackageInfo> packList = pm.getInstalledPackages(0);
            for (int i = 0; i < packList.size(); i++) {
                PackageInfo packInfo = packList.get(i);
                if ((packInfo.applicationInfo.flags & ApplicationInfo.FLAG_SYSTEM) == 0) {
                    String appName = packInfo.applicationInfo.loadLabel(pm).toString();
                    String pkgName = packInfo.packageName;
                    String versionName = packInfo.versionName;
                    int versionCode = packInfo.versionCode;
                    Drawable icon = packInfo.applicationInfo.loadIcon(pm);

                    list.add(new InstalledAppsModel(appName, pkgName, versionName, versionCode));
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return list;
    }

}
