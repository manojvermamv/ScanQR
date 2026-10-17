package com.anubhav.scanqr.utils;

import com.fasterxml.jackson.databind.SerializationFeature;
import com.google.gson.Gson;

import org.apache.commons.io.IOUtils;
import org.json.JSONException;
import org.json.JSONObject;

import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.ObjectInputStream;
import java.io.ObjectOutputStream;
import java.io.StringWriter;
import java.util.zip.GZIPInputStream;
import java.util.zip.GZIPOutputStream;

public class JSONUtils {

    public static void printObjectSizeKB(byte[] bytes) {
        double size_bytes = bytes.length;
        double size_kb = size_bytes / 1024;
        String cnt_size = size_kb + " KB";
        System.out.println("Converted Data Size : " + cnt_size);
    }

    public static String serializeObjectToString(Object object) {
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

    public static Object deserializeObjectFromString(String objectString) {
        try {
            byte[] byteArray = android.util.Base64.decode(objectString, android.util.Base64.DEFAULT);

            ByteArrayInputStream arrayInputStream = new ByteArrayInputStream(byteArray);
            GZIPInputStream gzipInputStream = new GZIPInputStream(arrayInputStream);
            ObjectInputStream objectInputStream = new ObjectInputStream(gzipInputStream);
            return objectInputStream.readObject();
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

    public static String objectToJsonString(Object object) {
        try {
            ObjectMapper objectMapper = new ObjectMapper();
            StringWriter stringEmp = new StringWriter();
            objectMapper.configure(SerializationFeature.INDENT_OUTPUT, true);
            objectMapper.writeValue(stringEmp, object);
            String jsonStr = stringEmp.toString();
            System.out.println("ObjectToJsonString ---> " + jsonStr);
            return jsonStr;
        } catch (Exception e) {
            e.printStackTrace();
            return "";
        }
    }

    public static <T> T objectFromJsonString(String json, Class<T> valueType) {
        try {
            return new ObjectMapper().readValue(json, valueType);
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

    /**
     * Convert Java objects to JSON String
     */
    public static String objectToJson(Object obj) {
        Gson gson = new Gson();
        String jsonString = gson.toJson(obj);
        System.out.println("objectToJson ---> " + jsonString);
        return jsonString;
    }

    /**
     * Convert Back Java objects from JSON String
     */
    public static <T> T objectFromJson(String json, Class<T> valueType) {
        Gson gson = new Gson();
        return gson.fromJson(json, valueType);
    }

    public static String getString(JSONObject obj, String name) throws JSONException {
        String strData = "";
        if (obj.has(name)) {
            strData = obj.getString(name);
        }

        if (strData.equals("") || strData.equalsIgnoreCase("null")) {
            strData = "";
        }
        return strData;
    }

    public static boolean getBoolean(JSONObject obj, String name) throws JSONException {
        boolean strData = false;
        if (obj.has(name)) {
            strData = obj.getBoolean(name);
        }
        return strData;
    }

    public static int getInteger(JSONObject obj, String name) throws JSONException {
        int strData = 0;
        if (obj.has(name)) {
            strData = obj.getInt(name);
        }
        return strData;
    }

}