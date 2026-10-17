package com.anubhav.scanqr;

import android.app.Activity;
import android.app.Dialog;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.provider.Settings;
import android.text.TextUtils;
import android.util.Log;
import android.view.View;
import android.view.ViewGroup;
import android.view.Window;
import android.view.inputmethod.InputMethodManager;
import android.webkit.URLUtil;
import android.widget.Button;
import android.widget.TextView;

import androidx.annotation.ColorRes;
import androidx.annotation.DimenRes;
import androidx.annotation.IntegerRes;
import androidx.annotation.LayoutRes;
import androidx.annotation.Nullable;
import androidx.annotation.StringRes;
import androidx.appcompat.app.AppCompatActivity;
import androidx.databinding.DataBindingUtil;
import androidx.databinding.ViewDataBinding;
import androidx.fragment.app.Fragment;
import androidx.fragment.app.FragmentManager;
import androidx.recyclerview.widget.RecyclerView;

import com.anubhav.commonutility.AppExecutors;
import com.anubhav.commonutility.CustomProgress;
import com.anubhav.commonutility.CustomToast;
import com.anubhav.commonutility.customfont.FontUtils;
import com.anubhav.scanqr.database.AppDatabase;
import com.anubhav.scanqr.utils.Global;
import com.anubhav.scanqr.utils.GlobalData;
import com.anubhav.scanqr.utils.HelperMethod;
import com.anubhav.scanqr.utils.PermissionsUtils;
import com.manoj.github.permissions.PermissionHandler;
import com.manoj.github.permissions.Permissions;

import java.util.ArrayList;
import java.util.Random;

import cn.pedant.SweetAlert.SweetAlertDialog;

abstract public class BaseActivity<viewBinding extends ViewDataBinding> extends AppCompatActivity {

    public static final String TAG = BaseActivity.class.getSimpleName();

    public Context context;
    public CustomToast customToast;
    public CustomProgress progressDialog;
    public View rootView;
    public AppDatabase appDatabase;

    protected viewBinding binding;

    @LayoutRes
    protected abstract int getLayoutResourceId();

    /**
     * Sets the content view, creates the binding and attaches the view to the view model
     * https://www.javatips.net/api/countries-master/countries-java/app/src/main/java/com/patloew/countries/ui/base/BaseActivity.java
     */
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        binding = DataBindingUtil.setContentView(this, getLayoutResourceId());
        //setContentView(binding.getRoot());
        //GlobalData.Fullscreen(BaseActivity.this);
        context = this;
        StartApp();
        resumeApp();
        checkPermissions();
    }

    @Override
    protected void onStart() {
        super.onStart();
    }

    @Override
    protected void onStop() {
        super.onStop();
    }

    @Override
    protected void onResume() {
        super.onResume();
    }

    public void resumeApp() {

    }

    private void StartApp() {
        context = this;
        customToast = new CustomToast(context);
        progressDialog = CustomProgress.getInstance(context);

        rootView = binding.getRoot();
        //ThemeUtils.setThemeFont(this, (ViewGroup) rootView);
        FontUtils.setFont(context, (ViewGroup) rootView);
        GlobalData.SetLanguage(context);
        hideKeyboard();

        appDatabase = AppDatabase.getInstance(context);
    }

    @Override
    protected void onPause() {
        super.onPause();
        hideKeyboard();
    }

    @Override
    public void onBackPressed() {
        super.onBackPressed();
    }

    public static void startActivity(Context context, Class<?> cls) {
        Intent intent = new Intent(context, cls);
        context.startActivity(intent);
    }

    public static void showActivityAnimation(Context context) {
        try {
            ((Activity) context).overridePendingTransition(R.anim.slide_from_right, R.anim.slide_to_left);
            //((Activity) context).overridePendingTransition(R.anim.slide_in_from_bottom, R.anim.fade_out);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }


    public void showInfoDialog(String title, String msg, int type) {
        showInfoDialog(title, msg, SweetAlertDialog::dismissWithAnimation, type);
    }

    public void showInfoDialog(String title, String msg, SweetAlertDialog.OnSweetClickListener clickListener, int type) {
        new SweetAlertDialog(context, type)
                .setTitleText(title)
                .setContentText(msg)
                .setConfirmText("OK")
                .setConfirmClickListener(clickListener)
                .show();
    }

    public void hideKeyboard() {
        InputMethodManager inputManager = (InputMethodManager) context.getSystemService(Context.INPUT_METHOD_SERVICE);
        // check if no view has focus
        View view = getCurrentFocus();
        if (view != null) {
            inputManager.hideSoftInputFromWindow(view.getWindowToken(), InputMethodManager.HIDE_NOT_ALWAYS);
        }
    }

    public void hideFragKeyboard(View view) {
        final InputMethodManager imm = (InputMethodManager) context.getSystemService(Context.INPUT_METHOD_SERVICE);
        imm.hideSoftInputFromWindow(view.getWindowToken(), 0);
    }

    public void switchContent(Fragment fragment, String tag) {
        hideKeyboard();
        getSupportFragmentManager()
                .beginTransaction()
                .replace(R.id.container, fragment)
                .addToBackStack(tag)
                .commit();
    }

    public void switchContent(Fragment fragment) {
        hideKeyboard();
        getSupportFragmentManager()
                .beginTransaction()
                .replace(R.id.container, fragment)
                .commit();
    }

    public void switchBack() {
        hideKeyboard();
        FragmentManager fragmentManager = getSupportFragmentManager();
        if (fragmentManager.getBackStackEntryCount() > 0) {
            fragmentManager.popBackStack();
        }
    }

    public void refreshRecyclerView(RecyclerView recyclerView) {
        RecyclerView.Adapter adapterRef = recyclerView.getAdapter();
        recyclerView.setAdapter(null);
        recyclerView.setAdapter(adapterRef);
    }

    /**
     * Check for required app permissions
     */
    public void checkPermissions() {
        checkPermissions(new PermissionHandler() {
            @Override
            public void onGranted(ArrayList<String> grantedPermissions) {
                for (String permission : grantedPermissions) {
                    System.out.println("Granted Permission ---> " + permission);
                }
            }

            @Override
            public void onDenied(Context context, ArrayList<String> deniedPermissions, ArrayList<String> grantedPermissions) {
                for (String permission : deniedPermissions) {
                    System.out.println("Denied Permission ---> " + permission);
                }
            }
        });
    }

    public void checkPermissions(PermissionHandler permissionHandler) {
        String strNeedPermission = "Need some Permissions";
        String strRationale = "This app needs permission to work properly.";
        Permissions.check(context, Global.permissionsRequired, strRationale, Global.permissionsOptions, permissionHandler);
    }

    public void showCheckPermissionDialog(String title, String msg) {
        Dialog dialog = new Dialog(context, R.style.CustomDialogTheme);
        dialog.requestWindowFeature(Window.FEATURE_NO_TITLE);
        dialog.setCancelable(false);
        dialog.setContentView(R.layout.dialog_required_permission);

        TextView textTitle = (TextView) dialog.findViewById(R.id.dialog_title);
        textTitle.setText(title);
        TextView textDesc = (TextView) dialog.findViewById(R.id.dialog_desc);
        textDesc.setText(msg);

        Button declineDialogButton = dialog.findViewById(R.id.bt_decline);
        declineDialogButton.setOnClickListener(v -> dialog.dismiss());

        Button confirmDialogButton = dialog.findViewById(R.id.bt_confirm);
        confirmDialogButton.setOnClickListener(v -> {
            dialog.dismiss();
            checkPermissions();
        });

        dialog.show();
    }

    public void showScanResultDialog(String msg) {
        Dialog dialog = new Dialog(context, R.style.CustomDialogTheme);
        dialog.requestWindowFeature(Window.FEATURE_NO_TITLE);
        dialog.setCancelable(true);
        dialog.setContentView(R.layout.dialog_scan_result);

        TextView textTitle = (TextView) dialog.findViewById(R.id.dialog_title);
        textTitle.setText(R.string.qr_code_details);
        TextView textDesc = (TextView) dialog.findViewById(R.id.dialog_desc);
        textDesc.setText(msg);

        Button declineDialogButton = dialog.findViewById(R.id.bt_decline);
        declineDialogButton.setOnClickListener(v -> dialog.dismiss());

        Button confirmDialogButton = dialog.findViewById(R.id.bt_confirm);
        if (URLUtil.isNetworkUrl(msg)) {
            confirmDialogButton.setText(R.string.go_to_website);
            confirmDialogButton.setOnClickListener(v -> {
                dialog.dismiss();
                GlobalData.openWebPage(context, msg);
            });

        } else {
            confirmDialogButton.setText(R.string.copy_text);
            confirmDialogButton.setOnClickListener(v -> {
                dialog.dismiss();
                ClipboardManager clipManager = (ClipboardManager) getSystemService(Context.CLIPBOARD_SERVICE);
                ClipData clip = ClipData.newPlainText(getString(R.string.qr_code_details), msg);
                clipManager.setPrimaryClip(clip);
                customToast.showToast("Details Copied", CustomToast.ToastySuccess);
            });
        }
        dialog.show();
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, @Nullable Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        switch (requestCode) {
        }
    }

    public String validateString(CharSequence str) {
        if (TextUtils.isEmpty(str)) {
            return "";
        }
        return str.toString();
    }

    public int dimen(@DimenRes int resId) {
        return (int) getResources().getDimension(resId);
    }

    public int color(@ColorRes int resId) {
        return getResources().getColor(resId);
    }

    public int integer(@IntegerRes int resId) {
        return getResources().getInteger(resId);
    }

    public String string(@StringRes int resId) {
        return getResources().getString(resId);
    }

}