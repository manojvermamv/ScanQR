package com.anubhav.scanqr.activities;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import android.widget.EditText;

import androidx.appcompat.app.AppCompatActivity;
import androidx.databinding.DataBindingUtil;

import com.anubhav.commonutility.CheckValidation;
import com.anubhav.commonutility.CustomProgress;
import com.anubhav.commonutility.CustomToast;
import com.anubhav.commonutility.customfont.FontUtils;
import com.anubhav.scanqr.R;
import com.anubhav.scanqr.databinding.ActUpdatePasswordBinding;
import com.anubhav.scanqr.utils.GlobalData;
import com.anubhav.scanqr.utils.Utils;


public class UpdatePasswordActivity extends AppCompatActivity implements View.OnClickListener {

    private String actType = "";
    public static final String EXTRA_SET_NEW_PASSWORD = "Set new password";

    private Context context;
    private CustomToast toast;
    public CustomProgress progressDialog;
    private ActUpdatePasswordBinding binding;

    private static final String TAG = UpdatePasswordActivity.class.getSimpleName();

    public static void startActivity(Activity activity, String actType, int requestCode) {
        startActivity(activity, actType, false, requestCode);
    }

    public static void startActivity(Activity activity, String actType, boolean canSkip, int requestCode) {
        Intent intent = new Intent(activity, UpdatePasswordActivity.class);
        intent.putExtra("actType", actType);
        intent.putExtra("canSkip", canSkip);
        activity.startActivityForResult(intent, requestCode);
        activity.overridePendingTransition(0, 0);
    }

    private void setResultIntent() {
        Intent intent = new Intent();
        setResult(RESULT_OK, intent);
        finish();
    }

    @Override
    public void finish() {
        super.finish();
        overridePendingTransition(0, 0);
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        binding = DataBindingUtil.setContentView(this, R.layout.act_update_password);
        GlobalData.setStatusBarFullScreen(this);

        context = this;
        toast = new CustomToast(context);
        progressDialog = CustomProgress.getInstance(context);
        FontUtils.setFont(context, (ViewGroup) binding.getRoot());

        binding.tvAppname.setText(actType);

        binding.btnSubmit.setSelected(true);
        binding.btnSkip.setSelected(true);

        binding.btnSubmit.setOnClickListener(v -> UpdatePasswordProcess());
        binding.btnSkip.setOnClickListener(v -> setResultIntent());
        binding.imgBack.setOnClickListener(v -> finish());
    }

    @SuppressLint("NonConstantResourceId")
    @Override
    public void onClick(View v) {
        switch (v.getId()) {
        }
    }

    /**
     * update user password complete process
     */
    private void UpdatePasswordProcess() {
        int response = 0;
        switch (actType) {
            case EXTRA_SET_NEW_PASSWORD:
                response = CheckValidation.emptyEditTextError(
                        new EditText[]{binding.edNewpass, binding.edConfirmNewpass},
                        new String[]{"Please enter new password", "Please enter confirm password"});

                if (response == 0 && !Utils.validatePassword(binding.edConfirmNewpass.getText())) {
                    toast.showToast("Password must be valid!", CustomToast.ToastyError);
                    response++;
                }

                if (response == 0) {
                    String newPass = binding.edNewpass.getText().toString().trim();
                    String newPassConfirm = binding.edConfirmNewpass.getText().toString().trim();

                    if (newPass.equals(newPassConfirm)) {

                    } else {
                        toast.showToast("Confirm password not matching!", CustomToast.ToastyError);
                    }
                }
                break;
        }
    }


}