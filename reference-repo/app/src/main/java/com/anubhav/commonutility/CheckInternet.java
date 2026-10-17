package com.anubhav.commonutility;

import android.app.Activity;
import android.content.Intent;
import android.provider.Settings;
import android.view.View;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.ProgressBar;
import android.widget.RelativeLayout;
import android.widget.TextView;

import androidx.core.content.ContextCompat;

import com.anubhav.scanqr.R;

import cn.pedant.SweetAlert.SweetAlertDialog;

public class CheckInternet {

    private final Activity activity;
    public NetworkChangeListener networkChangeListener;
    private static final String TAG = CheckInternet.class.getSimpleName();

    private FrameLayout layConnection;
    private RelativeLayout layProgressbarRefresh;
    private TextView textErrorTitle, textErrorDesc;
    private ImageView imgActivateWifi, imgActivateRefresh, imgActivateMobiledata;
    private ProgressBar progressBarRefresh;

    public CheckInternet(Activity activity, NetworkChangeListener networkChangeListener) {
        this.activity = activity;
        this.networkChangeListener = networkChangeListener;
        this.networkChangeListener.registerNetworkListener();
        initNoInternetScreen();
    }

    public void initNoInternetScreen() {
        View rootView = activity.findViewById(android.R.id.content);
        initNoInternetScreen(rootView);
    }

    public void initNoInternetScreen(View rootView) {
        layConnection = (FrameLayout) rootView.findViewById(R.id.lay_connection);
        layProgressbarRefresh = (RelativeLayout) rootView.findViewById(R.id.lay_activate_refresh);
        progressBarRefresh = (ProgressBar) rootView.findViewById(R.id.progressbar_refresh);
        textErrorTitle = (TextView) rootView.findViewById(R.id.nointernet_title);
        textErrorDesc = (TextView) rootView.findViewById(R.id.nointernet_desc);
        imgActivateWifi = (ImageView) rootView.findViewById(R.id.img_activate_wifi);
        imgActivateRefresh = (ImageView) rootView.findViewById(R.id.img_activate_refresh);
        imgActivateMobiledata = (ImageView) rootView.findViewById(R.id.img_activate_mobiledata);

        progressBarRefresh.setVisibility(View.INVISIBLE);

        imgActivateWifi.setOnClickListener(arg0 -> activity.startActivity(new Intent(Settings.ACTION_WIFI_SETTINGS)));

        layProgressbarRefresh.setOnClickListener(arg0 -> checkConnectingToInternet());

        imgActivateMobiledata.setOnClickListener(arg0 -> activity.startActivity(new Intent(Settings.ACTION_DATA_ROAMING_SETTINGS)));

    }

    public void checkConnectingToInternet() {
        boolean hasInternet = networkChangeListener.checkConnection();
        if (hasInternet) {
            hideError();
        } else {
            showError();
        }
    }

    // Create Alert using Builder
    public void showInternetAlert() {
        new SweetAlertDialog(activity, SweetAlertDialog.CUSTOM_IMAGE_TYPE)
                .setTitleText(getStringRes(R.string.no_internet_title))
                .setContentText(getStringRes(R.string.internet_msg))
                .setContentTextSize(16)
                .setCustomImage(R.drawable.app_logo)
                .setConfirmButtonTextColor(ContextCompat.getColor(activity, R.color.white))
                .setConfirmButtonBackgroundColor(ContextCompat.getColor(activity, R.color.green_300))
                .setCancelButtonTextColor(ContextCompat.getColor(activity, R.color.white))
                .setCancelButtonBackgroundColor(ContextCompat.getColor(activity, R.color.red_300))
                .setConfirmButton(getStringRes(R.string.internet_postivetext), new SweetAlertDialog.OnSweetClickListener() {
                    @Override
                    public void onClick(SweetAlertDialog sweetAlertDialog) {
                        checkConnectingToInternet();
                        sweetAlertDialog.dismissWithAnimation();
                    }
                })
                .setCancelButton(getStringRes(R.string.internet_negativetext), new SweetAlertDialog.OnSweetClickListener() {
                    @Override
                    public void onClick(SweetAlertDialog sweetAlertDialog) {
                        sweetAlertDialog.dismissWithAnimation();
                    }
                })
                .show();
    }

    public void showError() {
        if (layConnection != null) {
            layConnection.setVisibility(View.VISIBLE);
        }
    }

    public void hideError() {
        if (layConnection != null) {
            layConnection.setVisibility(View.GONE);
        }
    }

    public String getStringRes(int strId) {
        return activity.getResources().getString(strId);
    }

}
