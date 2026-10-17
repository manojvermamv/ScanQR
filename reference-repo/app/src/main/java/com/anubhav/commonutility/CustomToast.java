package com.anubhav.commonutility;

import android.app.Activity;
import android.content.Context;
import android.graphics.Typeface;
import android.graphics.drawable.Drawable;
import android.view.Gravity;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
import android.widget.TextView;
import android.widget.Toast;

import androidx.core.content.ContextCompat;

import com.anubhav.scanqr.R;
import com.anubhav.scanqr.utils.Global;

import es.dmoral.toasty.Toasty;

public class CustomToast {

    private final Context context;
    public static final int ToastyError = 0;
    public static final int ToastySuccess = 1;
    public static final int ToastyInfo = 2;
    public static final int ToastyWarning = 3;
    public static final int ToastyNormal = 4;
    public static final int ToastyNormalWithIcon = 5;

    public CustomToast(Context context) {
        this.context = context;
    }

    public static CustomToast Instance(Context context) {
        return new CustomToast(context);
    }

    //Toast a short message
    public void toast(String msg) {
        Toast.makeText(context, msg, Toast.LENGTH_SHORT).show();
    }

    //Toast a long message
    public void toastLong(String msg) {
        Toast.makeText(context, msg, Toast.LENGTH_LONG).show();
    }

    public void showToast(final String string) {
        showToast(string, ToastyNormal);
    }

    public void showToast(final String string, final int ToastType) {
        printString(string);
        if (context == null) return;

        Toasty.Config.getInstance()
                .tintIcon(true)
                .setToastTypeface(Typeface.createFromAsset(context.getAssets(), Global.CUSTOMFONTNAME))
                .setTextSize(18)
                .apply();

        ((Activity) context).runOnUiThread(new Runnable() {
            @Override
            public void run() {
                switch (ToastType) {
                    case ToastyError:
                        Toasty.error(context, string, Toast.LENGTH_LONG, true).show();
                        break;
                    case ToastySuccess:
                        Toasty.success(context, string, Toast.LENGTH_LONG, true).show();
                        break;
                    case ToastyInfo:
                        Toasty.info(context, string, Toast.LENGTH_LONG, true).show();
                        break;
                    case ToastyWarning:
                        Toasty.warning(context, string, Toast.LENGTH_LONG, true).show();
                        break;
                    case ToastyNormal:
                        Toasty.normal(context, string, Toast.LENGTH_LONG).show();
                        break;
                    case ToastyNormalWithIcon:
                        Drawable icon = context.getResources().getDrawable(R.drawable.loader);
                        Toasty.normal(context, string, icon).show();
                        break;
                    default:
                        break;
                }
            }
        });
    }

    public static void showCustomToast(final Context context, final String string) {
        showCustomToast(context, string, ToastyNormal);
    }

    public static void showCustomToast(final Context context, final String string, final int ToastType) {
        printString(string);
        if (context == null) return;
        Toasty.Config.getInstance()
                .tintIcon(true)
                .setToastTypeface(Typeface.createFromAsset(context.getAssets(), Global.CUSTOMFONTNAME))
                .setTextSize(18)
                .apply();

        ((Activity) context).runOnUiThread(new Runnable() {
            @Override
            public void run() {
                switch (ToastType) {
                    case ToastyError:
                        Toasty.error(context, string, Toast.LENGTH_LONG, true).show();
                        break;
                    case ToastySuccess:
                        Toasty.success(context, string, Toast.LENGTH_LONG, true).show();
                        break;
                    case ToastyInfo:
                        Toasty.info(context, string, Toast.LENGTH_LONG, true).show();
                        break;
                    case ToastyWarning:
                        Toasty.warning(context, string, Toast.LENGTH_LONG, true).show();
                        break;
                    case ToastyNormal:
                        Toasty.normal(context, string, Toast.LENGTH_LONG).show();
                        break;
                    case ToastyNormalWithIcon:
                        Drawable icon = ContextCompat.getDrawable(context, R.drawable.app_logo);
                        Toasty.normal(context, string, icon).show();
                        break;
                    default:
                        break;
                }
            }
        });
    }

    public static void customToast(Context context, String msg) {
        customToast(context, msg, Toast.LENGTH_LONG);
    }

    public static void customToast(Context context, String msg, int length) {
        ViewGroup rootView = (ViewGroup) ((Activity) context).findViewById(android.R.id.content);
        View toastLayout = LayoutInflater.from(context).inflate(R.layout.custom_toast_layout, rootView);

        TextView toastText = (TextView) toastLayout.findViewById(R.id.toast_text_view);
        toastText.setText(msg);

        ImageView toastImage = (ImageView) toastLayout.findViewById(R.id.toast_Image_view);
        toastImage.setImageResource(R.drawable.app_logo);
        toastImage.setVisibility(View.GONE);

        Toast toast = new Toast(context);
        toast.setGravity(Gravity.BOTTOM | Gravity.CENTER_HORIZONTAL, 0, 140);
        toast.setDuration(length);
        toast.setView(toastLayout);
        toast.show();
    }

    private static void printString(String string) {
        if (Global.ISTESTING) {
            System.out.println("toastString --> " + string);
        }
    }

}
