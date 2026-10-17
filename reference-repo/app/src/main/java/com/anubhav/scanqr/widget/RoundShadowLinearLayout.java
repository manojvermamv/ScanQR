package com.anubhav.scanqr.widget;

import android.content.Context;
import android.util.AttributeSet;
import android.view.Gravity;
import android.widget.LinearLayout;

import androidx.annotation.Nullable;

import com.anubhav.scanqr.R;
import com.anubhav.scanqr.utils.ViewUtils;

public class RoundShadowLinearLayout extends LinearLayout {

    public RoundShadowLinearLayout(Context context) {
        super(context);
        initBackground();
    }

    public RoundShadowLinearLayout(Context context, @Nullable AttributeSet attrs) {
        super(context, attrs);
        initBackground();
    }

    public RoundShadowLinearLayout(Context context, @Nullable AttributeSet attrs, int defStyleAttr) {
        super(context, attrs, defStyleAttr);
        initBackground();
    }

    private void initBackground() {
        setBackground(ViewUtils.generateBackgroundWithShadow(this, R.color.white,
                R.dimen.corner_radius, R.color.shadowColor, R.dimen.default_elevation, Gravity.BOTTOM));
    }

}