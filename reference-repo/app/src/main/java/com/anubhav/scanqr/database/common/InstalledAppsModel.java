package com.anubhav.scanqr.database.common;

import android.util.Log;

import androidx.room.ColumnInfo;
import androidx.room.Entity;
import androidx.room.Ignore;
import androidx.room.PrimaryKey;

import java.io.Serializable;

/**
 * The Class AppsListModel used as model for get Apps List.
 *
 * @author Manoj
 */

@Entity(tableName = "installed_apps")
public class InstalledAppsModel implements Serializable {

    @PrimaryKey(autoGenerate = true)
    private int taskId;

    @ColumnInfo(name = "appName")
    private String appName;

    @ColumnInfo(name = "pkgName")
    private String pkgName;

    @ColumnInfo(name = "versionName")
    private String versionName;

    @ColumnInfo(name = "versionCode")
    private int versionCode;

    @ColumnInfo(name = "isBlocked")
    private boolean isBlocked = false;

    @ColumnInfo(name = "usedTime")
    private String usedTime = "";

    //private Drawable icon;

    public InstalledAppsModel() {
        // empty constructor
    }

    @Ignore
    public InstalledAppsModel(int taskId, String appName, String pkgName, String versionName, int versionCode, boolean isBlocked, String usedTime) {
        this.taskId = taskId;
        this.appName = appName;
        this.pkgName = pkgName;
        this.versionName = versionName;
        this.versionCode = versionCode;
        this.isBlocked = isBlocked;
        this.usedTime = usedTime;
    }

    public InstalledAppsModel(String appName, String pkgName, String versionName, int versionCode) {
        this.appName = appName;
        this.pkgName = pkgName;
        this.versionName = versionName;
        this.versionCode = versionCode;
        this.isBlocked = false;
        this.usedTime = "";
    }

    public int getTaskId() {
        return taskId;
    }

    public void setTaskId(int taskId) {
        this.taskId = taskId;
    }

    public String getAppName() {
        return appName;
    }

    public void setAppName(String appName) {
        this.appName = appName;
    }

    public String getPkgName() {
        return pkgName;
    }

    public void setPkgName(String pkgName) {
        this.pkgName = pkgName;
    }

    public String getVersionName() {
        return versionName;
    }

    public void setVersionName(String versionName) {
        this.versionName = versionName;
    }

    public int getVersionCode() {
        return versionCode;
    }

    public void setVersionCode(int versionCode) {
        this.versionCode = versionCode;
    }

    public boolean isBlocked() {
        return isBlocked;
    }

    public void setBlocked(boolean blocked) {
        isBlocked = blocked;
    }

    public String getUsedTime() {
        return usedTime;
    }

    public void setUsedTime(String usedTime) {
        this.usedTime = usedTime;
    }

    public void prettyPrint() {
        Log.e(InstalledAppsModel.class.getSimpleName(), appName + "\t" + pkgName + "\t" + versionName + "\t" + versionCode);
    }

}