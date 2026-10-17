package com.anubhav.scanqr.database;

import android.content.Context;

import androidx.room.Database;
import androidx.room.Room;
import androidx.room.RoomDatabase;
import androidx.room.TypeConverters;

import com.anubhav.scanqr.database.common.InstalledAppsDao;
import com.anubhav.scanqr.database.common.InstalledAppsModel;

import java.util.concurrent.Executor;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@Database(entities = {
        InstalledAppsModel.class,
}, exportSchema = true, version = 2)
@TypeConverters({Converters.class})
public abstract class AppDatabase extends RoomDatabase {

    private static AppDatabase instance;
    final static ExecutorService executor = Executors.newFixedThreadPool(4);

    public static synchronized AppDatabase getInstance(Context context) {
        if (instance == null) {
            instance = Room.databaseBuilder(context, AppDatabase.class, "main_db")
                    .allowMainThreadQueries()
                    .fallbackToDestructiveMigration()
                    .build();
        }
        return instance;
    }

    public static Executor getExecutor() {
        return executor;
    }

    public abstract InstalledAppsDao installedAppsDao();

}