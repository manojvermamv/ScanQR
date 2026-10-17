package com.anubhav.scanqr.utils;

import android.content.Context;
import android.database.Cursor;
import android.graphics.Bitmap;
import android.media.MediaMetadataRetriever;
import android.net.Uri;
import android.util.Log;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;


public final class FileHelper {
    public static final FileHelper INSTANCE = new FileHelper();

    private FileHelper() {
    }


    public final String getFileNameCall(Context context, String str, String str2) throws Exception {
        /**
        if (str != null) {
            try {
                File file = new File(Config.getSharedRootDir(context), Config.ADDRESS_AUDIO_CALLS);
                if (!file.exists()) {
                    file.mkdirs();
                }
                String filterd = null;
                String replace = new Regex("[*+-]").replace(str, "");
                if (replace.length() > 10) {
                    int length = replace.length() - 10;
                    int length2 = replace.length();
                    filterd = replace.substring(length, length2);
                }
                return file.getAbsolutePath() + "/" + str2 + "," + filterd + ".mp3";
            } catch (Exception e) {
                throw new Exception(e);
            }
        } else {
            throw new Exception("Phone number can't be empty");
        }*/
        return null;
    }

    public final String getFileNameAudio(Context context, String str, String str2) throws Exception {
        try {
            File file = new File(Config.getAppDir(), Config.ADDRESS_AUDIO_RECORD);
            if (!file.exists()) {
                file.mkdirs();
            }
            return file.getAbsolutePath() + "/" + str2 + "," + str + ".mp3";
        } catch (Exception e) {
            throw new Exception(e);
        }
    }

    public final void deleteFileName(String str) {
        if (str != null) {
            try {
                File file = new File(str);
                if (file.exists()) {
                    file.delete();
                }
            } catch (Exception ignored) {
            }
        }
    }

    public final void deleteFile(String path) {
        if (path != null) {
            try {
                File file = new File(path);
                if (file.exists()) {
                    file.delete();
                }
            } catch (Exception e) {
                Log.e(Config.TAG, String.valueOf(e.getMessage()));
            }
        }
    }

    public final void deleteAllFile(String str) {
        try {
            File file = new File(Config.getAppDir(), str);
            if (file.isDirectory()) {
                File[] files = file.listFiles();
                if (files != null) {
                    for (File deleteFile : files)
                        deleteFile.delete();
                }
                return;
            }
            file.delete();
        } catch (Exception ignored) {
        }
    }

    public final String getContactName(Context context, String str) throws Exception {
        /**
        if (str != null) {
            String replace = new Regex("[*+-]").replace(str, "");
            Cursor query = context.getContentResolver().query(ContactsContract.CommonDataKinds.Phone.CONTENT_URI,
                    new String[]{"display_name", "data1"}, null, null, null);

            if (query != null) {
                int columnIndex = query.getColumnIndex("display_name");
                int columnIndex2 = query.getColumnIndex("data1");
                if (query.getCount() > 0) {
                    query.moveToFirst();

                    while (true) {
                        String string = query.getString(columnIndex);
                        String string2 = query.getString(columnIndex2);
                        if (new Regex("[*+-]").replace(string2, "").compareTo(replace) != 0) {
                            if (!query.moveToNext())
                                break;
                        } else {
                            replace = string;
                            break;
                        }
                    }
                }
                query.close();
            }
            return replace;
        }
        throw new Exception("Phone number can't be empty");
         */
        return null;
    }

    public final String getUriPath(Uri uri, Context context) {
        Cursor query = context.getContentResolver().query(uri, new String[]{"_data"}, null, null, null);
        if (query == null) {
            return null;
        }
        int columnIndexOrThrow = query.getColumnIndex("_data");
        query.moveToFirst();
        String string = query.getString(columnIndexOrThrow);
        query.close();
        return string;
    }

    public final String getDurationFile(String str) {
        StringBuilder sb;
        MediaMetadataRetriever mediaMetadataRetriever = new MediaMetadataRetriever();
        mediaMetadataRetriever.setDataSource(str);
        long parseLong = Long.parseLong(mediaMetadataRetriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_DURATION));
        long j = (long) 60000;
        String valueOf = String.valueOf((parseLong % j) / ((long) 1000));
        String valueOf2 = String.valueOf(parseLong / j);
        mediaMetadataRetriever.release();
        if (valueOf.length() == 1) {
            sb = new StringBuilder();
            sb.append(valueOf2);
            sb.append(":0");
        } else {
            sb = new StringBuilder();
            sb.append(valueOf2);
            sb.append(':');
        }
        sb.append(valueOf);
        return sb.toString();
    }

    public final String getFileNameBitmap(Bitmap bitmap, Context context, String str) throws IOException {
        File file = new File(Config.getAppDir(), Config.ADDRESS_IMAGE);
        if (!file.exists()) {
            file.mkdirs();
        }
        String filePath = file.getAbsolutePath() + "/" + str + ".png";
        ByteArrayOutputStream byteArrayOutputStream = new ByteArrayOutputStream();
        bitmap.compress(Bitmap.CompressFormat.PNG, 100, byteArrayOutputStream);

        FileOutputStream fileOutputStream = new FileOutputStream(new File(filePath));
        fileOutputStream.write(byteArrayOutputStream.toByteArray());
        fileOutputStream.flush();
        fileOutputStream.close();

        return filePath;
    }

}
