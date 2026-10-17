package com.anubhav.scanqr.database;

import androidx.room.TypeConverter;

import com.anubhav.scanqr.utils.phoneutils.DeviceInfo;
import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;

import java.io.Serializable;
import java.lang.reflect.Type;
import java.util.Date;
import java.util.List;

public class Converters implements Serializable {

    @TypeConverter
    public static String fromDeviceInfo(DeviceInfo deviceInfo) {
        if (deviceInfo == null) {
            return (null);
        }
        Type type = new TypeToken<List<DeviceInfo>>() {
        }.getType();
        String json = new Gson().toJson(deviceInfo, type);
        return json;
    }

    @TypeConverter
    public static DeviceInfo toDeviceInfo(String deviceInfoString) {
        if (deviceInfoString == null) {
            return (null);
        }
        Type type = new TypeToken<List<DeviceInfo>>() {
        }.getType();
        DeviceInfo deviceInfo = new Gson().fromJson(deviceInfoString, type);
        return deviceInfo;
    }

    @TypeConverter
    public static String fromStringList(List<String> list) {
        Gson gson = new Gson();
        String json = gson.toJson(list);
        return json;
    }

    @TypeConverter
    public static List<String> toStringList(String value) {
        Type listType = new TypeToken<List<String>>() {
        }.getType();
        return new Gson().fromJson(value, listType);
    }

    @TypeConverter
    public static String fromDate(Date date) {
        Gson gson = new Gson();
        String json = gson.toJson(date);
        return json;
    }

    @TypeConverter
    public static Date toDate(String value) {
        Type listType = new TypeToken<Date>() {
        }.getType();
        return new Gson().fromJson(value, listType);
    }

}