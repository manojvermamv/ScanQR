package com.anubhav.scanqr.utils;

import android.app.DownloadManager;
import android.content.Context;
import android.database.Cursor;
import android.media.MediaScannerConnection;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.util.Log;

import com.anubhav.scanqr.R;

import java.io.BufferedInputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.URL;
import java.net.URLConnection;

public class DownloadUtils {

    public static void saveFileDirectFromUrl(String strUrl, String saveFilePath) throws Exception {
        URL url = new URL(strUrl);
        BufferedInputStream in = new BufferedInputStream(url.openStream());
        FileOutputStream fileOutputStream = new FileOutputStream(saveFilePath);
        byte[] dataBuffer = new byte[1024];
        int bytesRead;
        while ((bytesRead = in.read(dataBuffer, 0, 1024)) != -1) {
            fileOutputStream.write(dataBuffer, 0, bytesRead);
        }
    }

    public static void saveFileDirectFromUrl2(String strUrl, String saveFilePath) throws Exception {
        URL url = new URL(strUrl);
        URLConnection c = url.openConnection();
        c.setDoOutput(true);
        c.connect();
        //int lenghtOfFile = c.getContentLength();

        FileOutputStream fos = new FileOutputStream(saveFilePath);
        InputStream is = c.getInputStream();

        byte[] buffer = new byte[1024];
        int len1;
        long total = 0;
        while ((len1 = is.read(buffer)) != -1) {
            total += len1;
            fos.write(buffer, 0, len1);
        }
        fos.close();
        is.close();
    }

    public static void downloadFileSystem(Context context, String url, String fileName, MediaScannerConnection.OnScanCompletedListener onScanCompletedListener) {
        try {
            DownloadManager.Request request = new DownloadManager.Request(Uri.parse(url));
            request.setDescription("Downloading File");
            request.setTitle(fileName);
            request.setVisibleInDownloadsUi(true);
            request.allowScanningByMediaScanner();
            request.setAllowedNetworkTypes(DownloadManager.Request.NETWORK_MOBILE | DownloadManager.Request.NETWORK_WIFI);
            request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);

            String destinationDir = Environment.getExternalStorageDirectory() + "/" + Environment.DIRECTORY_DOWNLOADS + "/" + context.getString(R.string.app_name) + "/";
            File mFile = new File(destinationDir, fileName);
            request.setDestinationUri(Uri.fromFile(mFile));

            DownloadManager downloadManager = (DownloadManager) context.getSystemService(Context.DOWNLOAD_SERVICE);
            downloadManager.enqueue(request);
            MediaScannerConnection.scanFile(context, new String[]{mFile.getAbsolutePath()}, null, onScanCompletedListener);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public static boolean downloadFileSystem(Context context, String url, String dirPath, String fileName) {
        DownloadManager.Request request = new DownloadManager.Request(Uri.parse(url));
        request.setDescription("Downloading Youtube");   //appears the same in Notification bar while downloading
        request.setTitle("youtube.apk");
        request.setVisibleInDownloadsUi(false);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.HONEYCOMB) {
            request.allowScanningByMediaScanner();
            request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_HIDDEN);
        }

        File file = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
        if (!file.exists()) {
            file.mkdirs();
        }

        request.setDestinationInExternalFilesDir(context, dirPath, fileName);

        DownloadManager downloadManager = (DownloadManager) context.getSystemService(Context.DOWNLOAD_SERVICE);
        long downloadID = downloadManager.enqueue(request);
        return downloadComplete(context, downloadID);
    }

    private static boolean downloadComplete(Context context, long downloadId) {
        DownloadManager downloadManager = (DownloadManager) context.getSystemService(Context.DOWNLOAD_SERVICE);
        Cursor c = downloadManager.query(new DownloadManager.Query().setFilterById(downloadId));
        if (c.moveToFirst()) {
            int status = c.getInt(c.getColumnIndex(DownloadManager.COLUMN_STATUS));
            if (status == DownloadManager.STATUS_SUCCESSFUL) {
                return true; //Download completed, celebrate
            } else {
                int reason = c.getInt(c.getColumnIndex(DownloadManager.COLUMN_REASON));
                Log.d("Download Manager", "Download not correct, status [" + status + "] reason [" + reason + "]");
                return false;
            }
        }
        return false;
    }

}
