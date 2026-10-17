package com.anubhav.scanqr.utils;

import org.apache.commons.io.IOUtils;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.ObjectInputStream;
import java.io.ObjectOutputStream;
import java.nio.charset.StandardCharsets;
import java.util.zip.GZIPInputStream;
import java.util.zip.GZIPOutputStream;

public class StringCompressor {

    public static String objectToString(Object object) {
        try {
            ByteArrayOutputStream arrayOutputStream = new ByteArrayOutputStream();
            GZIPOutputStream gzipOutputStream = new GZIPOutputStream(arrayOutputStream);
            ObjectOutputStream objectOutputStream = new ObjectOutputStream(gzipOutputStream);

            objectOutputStream.writeObject(object);
            IOUtils.closeQuietly(objectOutputStream);

            byte[] byteArray = arrayOutputStream.toByteArray();
            return android.util.Base64.encodeToString(byteArray, android.util.Base64.DEFAULT);
        } catch (Exception e) {
            e.printStackTrace();
            return "";
        }
    }

    public static Object objectFromString(String srcObj) {
        try {
            byte[] byteArray = android.util.Base64.decode(srcObj, android.util.Base64.DEFAULT);

            ByteArrayInputStream arrayInputStream = new ByteArrayInputStream(byteArray);
            GZIPInputStream gzipInputStream = new GZIPInputStream(arrayInputStream);
            ObjectInputStream objectInputStream = new ObjectInputStream(gzipInputStream);
            return objectInputStream.readObject();
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }


    /**
     * At server side, use ZipOutputStream to zip text to byte array, then convert
     * byte array to base64 string, so it can be transferred via http request.
     */
    public static String compressString(String srcTxt) {
        try {
            ByteArrayOutputStream arrayOutputStream = new ByteArrayOutputStream();
            GZIPOutputStream gzipOutputStream = new GZIPOutputStream(arrayOutputStream);

            gzipOutputStream.write(srcTxt.getBytes());
            IOUtils.closeQuietly(gzipOutputStream);

            byte[] bytes = arrayOutputStream.toByteArray();
            return android.util.Base64.encodeToString(bytes, android.util.Base64.DEFAULT);
        } catch (Exception e) {
            e.printStackTrace();
            return "";
        }
    }

    /**
     * When client receives the zipped base64 string, it first decode base64
     * String to byte array, then use ZipInputStream to revert the byte array to a
     * string.
     */
    public static String decompressString(String zippedBase64Str) {
        String result = "";
        try {
            byte[] bytes = android.util.Base64.decode(zippedBase64Str, android.util.Base64.DEFAULT);
            GZIPInputStream gzipInputStream = null;
            try {
                gzipInputStream = new GZIPInputStream(new ByteArrayInputStream(bytes));
                result = IOUtils.toString(gzipInputStream, StandardCharsets.UTF_8);
            } finally {
                IOUtils.closeQuietly(gzipInputStream);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return result;
    }

}
