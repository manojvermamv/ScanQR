package com.anubhav.commonutility;

import android.app.Activity;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;

import com.anubhav.scanqr.utils.Utils;

/**
 * Created by ManojVerma
 */
public class NetworkChangeReceiver extends BroadcastReceiver {

    // initialize listener
    public static ConnectionListener connectionListener;
    public static String TAG = NetworkChangeReceiver.class.getSimpleName();

    @Override
    public void onReceive(Context context, Intent intent) {
        Utils.Log(TAG, "onReceive Called.");

        // initialize connectivity manager
        ConnectivityManager connectivityManager = (ConnectivityManager) context.getSystemService(Context.CONNECTIVITY_SERVICE);

        // Initialize network info
        NetworkInfo networkInfo = connectivityManager.getActiveNetworkInfo();

        // check condition
        if (connectionListener != null) {

            // when connectivity receiver
            // listener  not null get connection status
            boolean isConnected = networkInfo != null && networkInfo.isConnectedOrConnecting();

            // call listener method
            connectionListener.onNetworkChanged(isConnected);
        }

    }

    public static boolean checkConnection(Activity activity, ConnectionListener connectionListener) {
        // initialize intent filter
        IntentFilter intentFilter = new IntentFilter();

        // add action
        intentFilter.addAction("android.new.conn.CONNECTIVITY_CHANGE");

        // register receiver
        activity.registerReceiver(new NetworkChangeReceiver(), intentFilter);

        // Initialize listener
        NetworkChangeReceiver.connectionListener = connectionListener;

        // Initialize connectivity manager
        ConnectivityManager manager = (ConnectivityManager) activity.getSystemService(Context.CONNECTIVITY_SERVICE);

        // Initialize network info
        NetworkInfo networkInfo = manager.getActiveNetworkInfo();

        // get connection status
        boolean isConnected = networkInfo != null && networkInfo.isConnectedOrConnecting();

        // return is network connected or not
        return isConnected;
    }

    public interface ConnectionListener {
        void onNetworkChanged(boolean isConnected);
    }

}