package com.anubhav.scanqr.activities;

import android.content.Intent;
import android.os.Bundle;
import android.os.Handler;

import androidx.appcompat.app.AppCompatActivity;

import com.anubhav.scanqr.MainActivity;
import com.anubhav.scanqr.R;

public class SplashActivity extends AppCompatActivity {

    public static final String TAG = SplashActivity.class.getSimpleName();

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        //ActSplashBinding binding = DataBindingUtil.setContentView(this, R.layout.act_splash);
        //GlobalData.setStatusBarFullScreen(this);
        //GlobalData.setLightStatusBar(this);

        //ThemeUtils.setThemeFont(this, (ViewGroup) binding.rootView);
        //GlobalData.SetLanguage(this);
        //binding.progressbar.setVisibility(View.VISIBLE);
        //binding.tvName.startAnimation(AnimationUtils.loadAnimation(this, R.anim.shake));

        new Handler().postDelayed(() -> {
            //binding.progressbar.setVisibility(View.INVISIBLE);
            //MainActivity.start(this);

            startActivity(new Intent(this, MainActivity.class));
            overridePendingTransition(R.anim.fade_in, R.anim.fade_out);
            finish();
        }, 200);

    }

}