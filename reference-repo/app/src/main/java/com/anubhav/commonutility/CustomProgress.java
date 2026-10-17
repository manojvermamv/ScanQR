package com.anubhav.commonutility;

import android.app.Dialog;
import android.content.Context;
import android.view.Gravity;
import android.view.View;
import android.view.WindowManager;
import android.widget.TextView;

import com.anubhav.scanqr.R;

public class CustomProgress extends Dialog {

    public CustomProgress(Context context, int layoutResID) {
        super(context, R.style.TransparentProgressDialog);
        WindowManager.LayoutParams wlmp = getWindow().getAttributes();
        wlmp.gravity = Gravity.CENTER_HORIZONTAL;
        getWindow().setAttributes(wlmp);
        setTitle(null);
        setCancelable(false);
        setOnCancelListener(null);
        setContentView(layoutResID);
    }

    @Override
    public void show() {
        super.show();
    }

    public static CustomProgress getInstance(Context ctx) {
        return getInstance(ctx, false);
    }

    public static CustomProgress getInstance(Context ctx, boolean isShowText) {
        CustomProgress customProgress = new CustomProgress(ctx, R.layout.lay_customprogessdialog);

        TextView textView = customProgress.findViewById(R.id.loader_showtext);
        if (isShowText) {
            textView.setVisibility(View.VISIBLE);
            textView.setText("Loading...");
        } else {
            textView.setVisibility(View.GONE);
        }

        customProgress.setCancelable(false);
        //customProgressDialog.show();
        return customProgress;
    }

    public static void hide(CustomProgress dialog) {
        try {
            if (dialog != null && dialog.isShowing()) {
                dialog.dismiss();
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

}