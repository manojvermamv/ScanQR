package com.anubhav.scanqr.database.common;

import androidx.room.Dao;
import androidx.room.Delete;
import androidx.room.Insert;
import androidx.room.OnConflictStrategy;
import androidx.room.Query;
import androidx.room.Update;

import java.util.List;

@Dao
public interface InstalledAppsDao {

    @Query("SELECT * FROM installed_apps")
    List<InstalledAppsModel> getInstalledAppsList();

    @Query("DELETE FROM installed_apps")
    void removeAll();

    @Query("SELECT * FROM installed_apps WHERE taskId = :taskId")
    InstalledAppsModel getInstalledApp(int taskId);

    @Insert
    void insertInstalledApp(InstalledAppsModel installedApp);

    @Update
    void updateInstalledApp(InstalledAppsModel installedApp);

    @Delete
    void deleteInstalledApp(InstalledAppsModel installedApp);

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    void insertAppsList(List<InstalledAppsModel> installedAppsList);

}