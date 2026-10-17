package com.anubhav.commonutility.customtheme;

import android.app.Activity;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.EditText;
import android.widget.TextView;

import com.anubhav.commonutility.customfont.FontUtils;
import com.anubhav.scanqr.R;
import com.anubhav.scanqr.utils.Preferences;

public class ThemeUtils {

    public ThemeUtils() {
    }

    private static int cTheme;
    public final static int DARK = 0;
    public final static int LIGHT = 1;

    public static void setThemeFont(Activity activity, ViewGroup root) {
        FontUtils.setFont(activity, root);

        //change app heme from
        boolean isDarkTheme = Preferences.readBoolean(activity, Preferences.IS_DARKTHEME, false);
        ThemeUtils.setThemeColor(root, activity, isDarkTheme);
    }

    public static void setTheme(Activity activity, int theme) {
        cTheme = theme;
        switch (cTheme) {
            default:
            case LIGHT:
                activity.setTheme(R.style.BaseThemeLight);
                break;
            case DARK:
                activity.setTheme(R.style.BaseThemeDark);
                break;
        }

        //activity.finish();
        //activity.startActivity(new Intent(activity, activity.getClass()));
        //activity.recreate();
    }

    public static void setThemeColor(ViewGroup group, Activity activity, boolean isDarkTheme) {
        int count = group.getChildCount();
        View v;
        for (int i = 0; i < count; i++) {
            v = group.getChildAt(i);
            if (v instanceof TextView || v instanceof EditText || v instanceof Button) {
                if (isDarkTheme) {
                    //((TextView) v).setBackgroundResource(R.drawable.back_textviewdark);
                    ((TextView) v).setTextColor(activity.getResources().getColor(R.color.dark_fontcolortextview));
                } else {
                    //((TextView) v).setBackgroundResource(R.drawable.back_textviewlight);
                    ((TextView) v).setTextColor(activity.getResources().getColor(R.color.c_white));
                }
            } else if (v instanceof EditText || v instanceof Button) {
                if (isDarkTheme) {
                    //((EditText) v).setBackgroundResource(R.drawable.back_edittextl_dark);
                    ((EditText) v).setTextColor(activity.getResources().getColor(R.color.dark_fontcoloreditext));
                } else {
                    //((EditText) v).setBackgroundResource(R.drawable.back_edittext_light);
                    ((EditText) v).setTextColor(activity.getResources().getColor(R.color.fontcoloreditext));
                }
            } else if (v instanceof Button) {
                if (isDarkTheme) {
                    //((TextView) v).setBackgroundResource(R.drawable.back_button_dark);
                    ((TextView) v).setTextColor(activity.getResources().getColor(R.color.dark_fontcolorbutton));
                } else {
                    //((TextView) v).setBackgroundResource(R.drawable.back_button_light);
                    ((TextView) v).setTextColor(activity.getResources().getColor(R.color.fontcolorbutton));
                }
            } else if (v instanceof ViewGroup) {
                setThemeColor((ViewGroup) v, activity, isDarkTheme);
            }
        }

        if (isDarkTheme) {
            //group.setBackgroundResource(R.drawable.back_lay_dark);
            setTheme(activity, DARK);
        } else {
            //group.setBackgroundResource(R.drawable.back_lay_light);
            setTheme(activity, LIGHT);
        }

    }

}