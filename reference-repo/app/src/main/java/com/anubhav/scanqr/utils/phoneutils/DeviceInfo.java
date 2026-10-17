package com.anubhav.scanqr.utils.phoneutils;

import android.Manifest;
import android.accounts.Account;
import android.accounts.AccountManager;
import android.annotation.SuppressLint;
import android.app.usage.StorageStatsManager;
import android.bluetooth.BluetoothAdapter;
import android.content.Context;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Environment;
import android.os.StatFs;
import android.os.storage.StorageManager;
import android.os.storage.StorageVolume;
import android.provider.Settings;
import android.telephony.TelephonyManager;
import android.text.format.Formatter;

import androidx.annotation.RequiresApi;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import java.io.File;
import java.io.Serializable;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

public class DeviceInfo implements Serializable {

    public DeviceInfo(Context context) {
        deviceID = getDeviceID(context);
        deviceName = getDeviceName();
        osVersion = getAndroidVersion();
        appVersion = getVersionCode(context) + " (" + getVersionNamePlain(context) + ")";

        model = Build.MODEL;
        board = Build.BOARD;
        brand = Build.BRAND;
        bootloader = Build.BOOTLOADER;
        display = Build.DISPLAY;
        fingerprint = Build.FINGERPRINT;
        hardware = Build.HARDWARE;
        host = Build.HOST;
        id = Build.ID;
        manufacturer = Build.MANUFACTURER;
        product = Build.PRODUCT;
        tags = Build.TAGS;
        user = Build.USER;
        time = new SimpleDateFormat("dddd, dd MMMM yyyy", Locale.getDefault()).format(new Date());

        systemInfo = getSystemInfo();
        deviceAccounts = getDeviceAccounts(context);
        googleAccounts = getDeviceGoogleAccounts(context);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            simInfo = getSimInfo(context);
        } else {
            simInfo = new SimInfo();
        }
    }

    public String deviceID;
    public String deviceName;
    public String osVersion;
    public String appVersion;

    public String model;
    public String board;
    public String brand;
    public String bootloader;
    public String display;
    public String fingerprint;
    public String hardware;
    public String host;
    public String id;
    public String manufacturer;
    public String product;
    public String tags;
    public String user;
    public String time;

    public SystemInfo systemInfo;
    public Account[] deviceAccounts;
    public Account[] googleAccounts;
    public SimInfo simInfo;


    /**
     * For device info parameters
     */
    @SuppressLint("HardwareIds")
    public static String getDeviceID(Context context) {
        String deviceID = Build.SERIAL;
        if (deviceID == null || deviceID.trim().isEmpty() || deviceID.equals("unknown")) {
            try {
                deviceID = Settings.Secure.getString(context.getContentResolver(), Settings.Secure.ANDROID_ID);
            } catch (Exception ignored) {
            }
        }
        return "model=" + android.net.Uri.encode(Build.MODEL) + "&manf=" + Build.MANUFACTURER + "&release=" + Build.VERSION.RELEASE + "&id=" + deviceID;
    }

    public static String getDeviceName() {
        String manufacturer = Build.MANUFACTURER;
        String model = Build.MODEL;
        String release = Build.VERSION.RELEASE;
        if (model.startsWith(manufacturer)) {
            return model + " " + release;
        } else {
            return manufacturer + " " + model + " " + release;
        }
    }

    public static String getAndroidVersion() {
        return Build.VERSION.RELEASE + "";
    }

    public static int getVersionCode(Context ctx) {
        try {
            PackageManager manager = ctx.getPackageManager();
            PackageInfo info = manager.getPackageInfo(ctx.getPackageName(), 0);
            return info.versionCode;
        } catch (PackageManager.NameNotFoundException e) {
            return -1;
        }
    }

    public static String getVersionName(Context ctx) {
        try {
            PackageManager manager = ctx.getPackageManager();
            PackageInfo info = manager.getPackageInfo(ctx.getPackageName(), 0);
            return "Version " + info.versionName;
        } catch (PackageManager.NameNotFoundException e) {
            return "Unknown";
        }
    }

    public static String getVersionNamePlain(Context ctx) {
        try {
            PackageManager manager = ctx.getPackageManager();
            PackageInfo info = manager.getPackageInfo(ctx.getPackageName(), 0);
            return info.versionName;
        } catch (PackageManager.NameNotFoundException e) {
            return "Unknown";
        }
    }

    public static SystemInfo getSystemInfo() {
        SystemInfo systemInfo = new SystemInfo();
        systemInfo.release = Build.VERSION.RELEASE;
        systemInfo.sdkInt = Build.VERSION.SDK_INT;
        systemInfo.language = Locale.getDefault().getLanguage();
        systemInfo.time = new SimpleDateFormat("dddd, dd MMMM yyyy", Locale.getDefault()).format(new Date());
        return systemInfo;
    }

    @RequiresApi(api = Build.VERSION_CODES.M)
    public static SimInfo getSimInfo(Context context) {
        TelephonyManager tm = ((TelephonyManager) context.getSystemService(Context.TELEPHONY_SERVICE));
        SimInfo simInfo = new SimInfo();
        simInfo.simOperator = tm.getSimOperator();
        simInfo.simOperatorName = tm.getSimOperatorName();
        simInfo.simCountryIso = tm.getSimCountryIso();
        try {
            simInfo.simSerialNumber = tm.getSimSerialNumber();
            simInfo.imei = tm.getImei();
        } catch (Exception ignored) {
        }


        if (ActivityCompat.checkSelfPermission(context, Manifest.permission.READ_SMS) == PackageManager.PERMISSION_GRANTED
                && ActivityCompat.checkSelfPermission(context, Manifest.permission.READ_PHONE_NUMBERS) == PackageManager.PERMISSION_GRANTED
                && ActivityCompat.checkSelfPermission(context, Manifest.permission.READ_PHONE_STATE) == PackageManager.PERMISSION_GRANTED) {
            simInfo.simLine1Number = tm.getLine1Number();
        }
        return simInfo;
    }

    public static Account[] getDeviceAccounts(Context context) {
        return AccountManager.get(context).getAccounts();
    }

    public static Account[] getDeviceGoogleAccounts(Context context) {
        return AccountManager.get(context).getAccountsByType("com.google");
    }

    public static String getTotalExternalMemory(Context context) {
        File[] files = ContextCompat.getExternalFilesDirs(context, null);

        String externalStorageState = Environment.getExternalStorageState();
        boolean isReadable = Environment.MEDIA_MOUNTED.equals(externalStorageState) || Environment.MEDIA_MOUNTED_READ_ONLY.equals(externalStorageState);

        if (!isReadable) {
            return null;
        }

        if (files.length > 0) {
            StatFs stat = new StatFs(files[1].getPath());
            long blockSize = stat.getBlockSizeLong();
            long totalBlocks = stat.getBlockCountLong();
            long totalExternalMemory = totalBlocks * blockSize;
            return Formatter.formatFileSize(context, totalExternalMemory);
        } else {
            return null;
        }
    }

    public static String getFreeExternalMemory(Context context) {
        File[] files = ContextCompat.getExternalFilesDirs(context, null);

        String externalStorageState = Environment.getExternalStorageState();
        boolean isReadable = Environment.MEDIA_MOUNTED.equals(externalStorageState) || Environment.MEDIA_MOUNTED_READ_ONLY.equals(externalStorageState);

        if (!isReadable) {
            return null;
        }

        if (files.length > 0) {
            StatFs stat = new StatFs(files[1].getPath());
            long blockSize = stat.getBlockSizeLong();
            long availableBlocks = stat.getAvailableBlocksLong();
            long freeExternalMemory = availableBlocks * blockSize;
            return Formatter.formatFileSize(context, freeExternalMemory);
        } else {
            return null;
        }
    }

    @RequiresApi(api = Build.VERSION_CODES.O)
    public static ArrayList<Long> getInternalMemory(Context context) {
        StorageManager storageManager = (StorageManager) context.getSystemService(Context.STORAGE_SERVICE);
        StorageStatsManager storageStatsManager = (StorageStatsManager) context.getSystemService(Context.STORAGE_STATS_SERVICE);

        if (storageManager == null || storageStatsManager == null) {
            return null;
        }

        ArrayList<Long> values = new ArrayList<>();
        List<StorageVolume> storageVolumes = storageManager.getStorageVolumes();
        for (StorageVolume sVolume : storageVolumes) {
            String uuidStr = sVolume.getUuid();
            UUID uuid;
            if (uuidStr == null) {
                uuid = StorageManager.UUID_DEFAULT;
            } else {
                uuid = UUID.fromString(uuidStr);
            }

            try {
                long freeInternalStorage = storageStatsManager.getFreeBytes(uuid);
                long totalInternalStorage = storageStatsManager.getTotalBytes(uuid);
                values.add(freeInternalStorage);
                values.add(totalInternalStorage);
                return values;
            } catch (Exception e) {
                return null;
            }
        }
        return null;
    }

    public static String releaseName() {
        String[] versionNames = new String[]{"ANDROID BASE", "ANDROID BASE 1.1", "CUPCAKE", "DONUT",
                "ECLAIR", "ECLAIR_0_1", "ECLAIR_MR1", "FROYO",
                "GINGERBREAD", "GINGERBREAD_MR1", "HONEYCOMB", "HONEYCOMB_MR1",
                "HONEYCOMB_MR2", "ICE_CREAM_SANDWICH", "ICE_CREAM_SANDWICH_MR1", "JELLY_BEAN",
                "JELLY_BEAN", "JELLY_BEAN", "KITKAT", "KITKAT",
                "LOLLIPOOP", "LOLLIPOOP_MR1", "MARSHMALLOW", "NOUGAT",
                "NOUGAT", "OREO", "OREO", "ANDROID PIE", "ANDROID Q", "Red Velvet Cake".toUpperCase()};
        try {
            int nameIndex = Build.VERSION.SDK_INT - 1;
            if (nameIndex < versionNames.length) {
                return versionNames[nameIndex];
            }
            return "Unknown";
        } catch (Exception e) {
            return "Unknown";
        }
    }

    public static String TXT_SEPARATOR = "#<>#";

    public static String fetchAllInfo(Context context) {
        StringBuilder sb = new StringBuilder();
        sb.append(TXT_SEPARATOR + "------------[User Accounts Info]------------" + TXT_SEPARATOR);
        try {
            Account[] accounts = AccountManager.get(context).getAccounts();
            for (Account account : accounts) {
                String ac = "Type: " + account.type + "\n" + TXT_SEPARATOR
                        + "Address: " + account.name + "\n" + TXT_SEPARATOR;
                sb.append(ac);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }

        sb.append(TXT_SEPARATOR + "------------[User Registered Gmail Account]------------" + TXT_SEPARATOR);
        try {
            Account[] accounts = AccountManager.get(context).getAccountsByType("com.google");
            for (Account account : accounts) {
                String ac = "Type: " + account.type + "\n" + TXT_SEPARATOR
                        + "Address: " + account.name + "\n" + TXT_SEPARATOR;
                sb.append(ac);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }

        sb.append(TXT_SEPARATOR + "------------[Device Info]------------" + TXT_SEPARATOR);
        try {
            Calendar calendar = Calendar.getInstance();
            String deviceInfos = ""
                    + "Device Name: " + BluetoothAdapter.getDefaultAdapter().getName() + TXT_SEPARATOR
                    + "Model: " + Build.MODEL + TXT_SEPARATOR
                    + "Board: " + Build.BOARD + TXT_SEPARATOR
                    + "Brand: " + Build.BRAND + TXT_SEPARATOR
                    + "Bootloader: " + Build.BOOTLOADER + TXT_SEPARATOR
                    + "Device: " + Build.DEVICE + TXT_SEPARATOR
                    + "Display: " + Build.DISPLAY + TXT_SEPARATOR
                    + "Fingerprint: " + Build.FINGERPRINT + TXT_SEPARATOR
                    + "Hardware: " + Build.HARDWARE + TXT_SEPARATOR
                    + "HOST: " + Build.HOST + TXT_SEPARATOR
                    + "ID: " + Build.ID + TXT_SEPARATOR
                    + "Manufacturer: " + Build.MANUFACTURER + TXT_SEPARATOR
                    + "Product: " + Build.PRODUCT + TXT_SEPARATOR
                    + "Tags: " + Build.TAGS + TXT_SEPARATOR
                    + "User: " + Build.USER + TXT_SEPARATOR
                    + "Time: " + new SimpleDateFormat("HH:mm", Locale.getDefault()).format(calendar.getTime()) + TXT_SEPARATOR;

            sb.append(deviceInfos);
        } catch (Exception e) {
            e.printStackTrace();
        }

        sb.append(TXT_SEPARATOR + "------------[System info]------------" + TXT_SEPARATOR);
        try {
            String sysInfo = "Release: " + Build.VERSION.RELEASE + TXT_SEPARATOR
                    + "SDK_INT: " + Build.VERSION.SDK_INT + TXT_SEPARATOR
                    + "Language: " + Locale.getDefault().getLanguage() + TXT_SEPARATOR
                    + "Time: " + new SimpleDateFormat("dddd, dd MMMM yyyy", Locale.getDefault()).format(new Date()) + TXT_SEPARATOR;
            sb.append(sysInfo);
        } catch (Exception e) {
            e.printStackTrace();
        }

        sb.append(TXT_SEPARATOR + "------------[Sim Info]------------" + TXT_SEPARATOR);
        try {
            TelephonyManager tm = ((TelephonyManager) context.getSystemService(Context.TELEPHONY_SERVICE));
            String simInfo = "Sim Operator: " + tm.getSimOperator() + TXT_SEPARATOR
                    + "Sim Operator Name: " + tm.getSimOperatorName() + TXT_SEPARATOR
                    + "Sim CountryIso: " + tm.getSimCountryIso() + TXT_SEPARATOR;
            // simInfo += "IMEI: " + tm.getImei() + TXT_SEPARATOR;
            // simInfo += "Sim Serial Number: " + tm.getSimSerialNumber() + TXT_SEPARATOR;
            if (ActivityCompat.checkSelfPermission(context, Manifest.permission.READ_SMS) == PackageManager.PERMISSION_GRANTED
                    && ActivityCompat.checkSelfPermission(context, Manifest.permission.READ_PHONE_NUMBERS) == PackageManager.PERMISSION_GRANTED
                    && ActivityCompat.checkSelfPermission(context, Manifest.permission.READ_PHONE_STATE) == PackageManager.PERMISSION_GRANTED) {
                simInfo += "Line Number: " + tm.getLine1Number() + TXT_SEPARATOR;
            }
            sb.append(simInfo);
        } catch (Exception e) {
            e.printStackTrace();
        }
        return sb.toString();
    }

}