package com.anubhav.commonutility;

import android.graphics.Bitmap;

import androidx.collection.LruCache;

public class MyCacheLru {

    private static MyCacheLru instance;
    private final LruCache<Object, Object> lru;

    private MyCacheLru() {
        lru = new LruCache<Object, Object>(1024);
    }

    public static MyCacheLru getInstance() {
        if (instance == null) {
            instance = new MyCacheLru();
        }
        return instance;
    }

    public LruCache<Object, Object> getLru() {
        return lru;
    }

    public void saveBitmap(String key, Bitmap bitmap) {
        try {
            MyCacheLru.getInstance().getLru().put(key, bitmap);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public Bitmap retrieveBitmap(String key) {
        try {
            return (Bitmap) MyCacheLru.getInstance().getLru().get(key);
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

}