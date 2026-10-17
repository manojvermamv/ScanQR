package com.anubhav.commonutility;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Context;
import android.net.ConnectivityManager;
import android.net.Network;
import android.net.NetworkCapabilities;
import android.net.NetworkInfo;
import android.net.NetworkRequest;
import android.os.AsyncTask;
import android.os.Build;
import android.util.Log;

import androidx.annotation.NonNull;

import java.net.InetSocketAddress;
import java.net.Socket;
import java.net.SocketAddress;

/**
 * Created by ManojVerma
 */
public class NetworkChangeListener {

    public Activity activity;
    public ConnectivityManager connectivityManager;
    public ConnectivityManager.NetworkCallback connectivityCallback;
    public ConnectionListener connectionListener;
    public static String TAG = NetworkChangeListener.class.getSimpleName();

    public NetworkChangeListener(Activity activity, ConnectionListener connectionListener) {
        this.activity = activity;
        this.connectivityManager = (ConnectivityManager) activity.getSystemService(Context.CONNECTIVITY_SERVICE);
        this.connectionListener = connectionListener;
    }

    public void registerNetworkListener() {
        Log.d(TAG, "registerNetworkListener : called");

        NetworkRequest networkRequest = new NetworkRequest.Builder()
                .addCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
                .addTransportType(NetworkCapabilities.TRANSPORT_WIFI)
                .addTransportType(NetworkCapabilities.TRANSPORT_CELLULAR)
                .build();

        connectivityCallback = getConnectivityManagerCallback();
        connectivityManager.registerNetworkCallback(networkRequest, connectivityCallback);

    }

    public void unregisterNetworkListener() {
        Log.d(TAG, "unregisterNetworkListener : called");
        connectivityManager.unregisterNetworkCallback(connectivityCallback);
    }

    public boolean checkConnection() {
        if (connectivityManager != null) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                NetworkCapabilities capabilities = connectivityManager.getNetworkCapabilities(connectivityManager.getActiveNetwork());
                if (capabilities != null && capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)) {
                    return checkInternet();
                } else {
                    return false;
                }

            } else {
                NetworkInfo networkInfo = connectivityManager.getActiveNetworkInfo();
                boolean hasInternet = networkInfo != null && networkInfo.isConnectedOrConnecting();
                if (hasInternet) {
                    hasInternet = checkInternet();
                }
                return hasInternet;

            }
        }
        return false;
    }

    public ConnectivityManager.NetworkCallback getConnectivityManagerCallback() {
        return new ConnectivityManager.NetworkCallback() {
            @Override
            public void onAvailable(@NonNull Network network) {
                super.onAvailable(network);
                Log.d(TAG, "onAvailable");
                NetworkCapabilities networkCapabilities = connectivityManager.getNetworkCapabilities(network);
                if (networkCapabilities == null) {
                    activity.runOnUiThread(() -> connectionListener.onNetworkChanged(false));
                }
            }

            @Override
            public void onLost(@NonNull Network network) {
                super.onLost(network);
                Log.d(TAG, "onLost");
                activity.runOnUiThread(() -> connectionListener.onNetworkChanged(false));
            }

            @Override
            public void onCapabilitiesChanged(@NonNull Network network, @NonNull NetworkCapabilities networkCapabilities) {
                super.onCapabilitiesChanged(network, networkCapabilities);
                Log.d(TAG, "onCapabilitiesChanged");
                determineInternetAccess(networkCapabilities);
            }

        };
    }

    private void determineInternetAccess(NetworkCapabilities networkCapability) {
        if (networkCapability != null && networkCapability.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)) {
            boolean isInternet = checkInternet();
            activity.runOnUiThread(() -> connectionListener.onNetworkChanged(isInternet));
        } else {
            activity.runOnUiThread(() -> connectionListener.onNetworkChanged(false));
        }
    }

    @SuppressLint("StaticFieldLeak")
    private boolean checkInternet() {
        boolean hasInternet;
        try {
            hasInternet = new AsyncTask<Void, Void, Boolean>() {
                @Override
                protected Boolean doInBackground(Void... voids) {
                    try {
                        Socket socket = new Socket();
                        SocketAddress sockAddress = new InetSocketAddress("8.8.8.8", 53);
                        socket.connect(sockAddress, 1000);
                        socket.close();
                        return true;
                    } catch (Exception e) {
                        e.printStackTrace();
                        return false;
                    }
                }
            }.execute().get();
        } catch (Exception e) {
            e.printStackTrace();
            hasInternet = false;
        }
        return hasInternet;
    }

    public static boolean checkHasInternet() {
        boolean hasInternet;
        try {
            hasInternet = new AsyncTask<Void, Void, Boolean>() {
                @Override
                protected Boolean doInBackground(Void... voids) {
                    try {
                        Socket socket = new Socket();
                        SocketAddress sockAddress = new InetSocketAddress("8.8.8.8", 53);
                        socket.connect(sockAddress, 1000);
                        socket.close();
                        return true;
                    } catch (Exception e) {
                        e.printStackTrace();
                        return false;
                    }
                }
            }.execute().get();
        } catch (Exception e) {
            e.printStackTrace();
            hasInternet = false;
        }
        return hasInternet;
    }

    public interface ConnectionListener {
        void onNetworkChanged(boolean isConnected);
    }

}
