package com.anubhav.scanqr.activities;

import android.Manifest;
import android.annotation.TargetApi;
import android.content.Context;
import android.content.DialogInterface;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.graphics.PorterDuff;
import android.graphics.drawable.Animatable;
import android.graphics.drawable.Drawable;
import android.net.Uri;
import android.os.AsyncTask;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.os.StrictMode;
import android.provider.MediaStore;
import android.util.Log;
import android.view.Menu;
import android.view.MenuItem;
import android.view.View;
import android.view.ViewGroup;
import android.view.Window;
import android.view.WindowManager;
import android.widget.RelativeLayout;
import android.widget.TextView;

import androidx.annotation.ColorInt;
import androidx.annotation.DrawableRes;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.appcompat.app.ActionBar;
import androidx.appcompat.app.AlertDialog;
import androidx.appcompat.app.AppCompatActivity;
import androidx.appcompat.widget.Toolbar;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import androidx.core.content.FileProvider;

import com.anubhav.commonutility.MyCache;
import com.anubhav.scanqr.utils.Global;
import com.anubhav.commonutility.CustomToast;
import com.anubhav.commonutility.customfont.FontUtils;
import com.anubhav.scanqr.R;
import com.anubhav.scanqr.database.model.CustomFile;
import com.anubhav.scanqr.utils.FileUtil;
import com.anubhav.scanqr.utils.GlobalData;
import com.manoj.github.permissions.PermissionHandler;
import com.manoj.github.permissions.Permissions;
import com.yalantis.ucrop.UCrop;
import com.yalantis.ucrop.UCropFragment;
import com.yalantis.ucrop.UCropFragmentCallback;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.util.ArrayList;
import java.util.Collection;

import gun0912.tedbottompicker.TedBottomPicker;
import gun0912.tedbottompicker.TedBottomSheetDialogFragment;

public class ActivityBrowseGallery extends AppCompatActivity implements View.OnClickListener, UCropFragmentCallback {
    private Context svContext;
    public static Uri imageUri = null;
    private TextView dialogCancel;
    private RelativeLayout openGallery, openCamera;
    private RelativeLayout rlayImageSelect;
    protected static final int REQUEST_STORAGE_READ_ACCESS_PERMISSION = 101;
    protected static final int REQUEST_STORAGE_WRITE_ACCESS_PERMISSION = 102;
    protected static final int REQUEST_CAMERA_ACCESS_PERMISSION = 103;
    private static final int TAKE_PICTURE = 2;
    private static final int BROWSE_PICTURE = 1;
    private UCropFragment fragment;
    private boolean mShowLoader;
    private String mToolbarTitle;
    @DrawableRes
    private int mToolbarCancelDrawable;
    @DrawableRes
    private int mToolbarCropDrawable;
    private int mToolbarColor;
    private int mStatusBarColor;
    private int mToolbarWidgetColor;
    private AlertDialog mAlertDialog;
    private static final int REQUEST_SELECT_PICTURE = 0x01;
    private static final int REQUEST_SELECT_PICTURE_FOR_FRAGMENT = 0x02;
    private static final String SAMPLE_CROPPED_IMAGE_NAME = "CropImage";
    private Toolbar toolbar;
    private CustomToast customToast;
    private View rootView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.act_browse_gallery);
        GlobalData.setStatusBarFullScreen(this);
        svContext = this;
        rootView = findViewById(R.id.mylayout);
        FontUtils.setFont(svContext, (ViewGroup) rootView);
        customToast = new CustomToast(svContext);

        rlayImageSelect = (RelativeLayout) findViewById(R.id.lay_uploadimage);
        openGallery = (RelativeLayout) findViewById(R.id.dialog_fromgallery);
        openCamera = (RelativeLayout) findViewById(R.id.dialog_fromcamera);
        dialogCancel = findViewById(R.id.dialog_cancel);

        dialogCancel.setSelected(true);

        openGallery.setOnClickListener(this);
        openCamera.setOnClickListener(this);
        dialogCancel.setOnClickListener(this);

        StrictMode.VmPolicy.Builder builder = new StrictMode.VmPolicy.Builder();
        StrictMode.setVmPolicy(builder.build());

        ShowUploadDialog();
    }

    @Override
    public void onClick(View v) {
        switch (v.getId()) {
            case R.id.dialog_fromgallery:
                browseImageFromGallery();
                break;
            case R.id.dialog_fromcamera:
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.JELLY_BEAN && Build.VERSION.SDK_INT <= Build.VERSION_CODES.Q &&
                        ActivityCompat.checkSelfPermission(this, Manifest.permission.WRITE_EXTERNAL_STORAGE) != PackageManager.PERMISSION_GRANTED) {
                    requestPermission(Manifest.permission.WRITE_EXTERNAL_STORAGE, getString(R.string.permission_write_storage_rationale), REQUEST_STORAGE_WRITE_ACCESS_PERMISSION);
                } else {
                    browseImageFromCamera();
                }
                break;
            case R.id.dialog_cancel:
//                HideUploadDialog();
                finish();
                break;
            default:
                break;
        }
    }

    public void browseImageFromGallery() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.JELLY_BEAN && Build.VERSION.SDK_INT <= Build.VERSION_CODES.Q &&
                ActivityCompat.checkSelfPermission(this, Manifest.permission.READ_EXTERNAL_STORAGE) != PackageManager.PERMISSION_GRANTED) {
            requestPermission(Manifest.permission.READ_EXTERNAL_STORAGE,
                    getString(R.string.permission_read_storage_rationale),
                    REQUEST_STORAGE_READ_ACCESS_PERMISSION);
        } else {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.JELLY_BEAN && Build.VERSION.SDK_INT <= Build.VERSION_CODES.Q &&
                    ActivityCompat.checkSelfPermission(this, Manifest.permission.WRITE_EXTERNAL_STORAGE) != PackageManager.PERMISSION_GRANTED) {
                requestPermission(Manifest.permission.WRITE_EXTERNAL_STORAGE,
                        getString(R.string.permission_write_storage_rationale),
                        REQUEST_STORAGE_WRITE_ACCESS_PERMISSION);
            } else {
                TedBottomPicker.with(this)
                        .show(new TedBottomSheetDialogFragment.OnImageSelectedListener() {
                            @Override
                            public void onImageSelected(Uri uri) {
                                startCrop(uri);
                            }
                        });
            }
        }
    }

    private void browseImageFromCamera() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.JELLY_BEAN && ActivityCompat.checkSelfPermission(this, Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) {
            requestPermission(Manifest.permission.CAMERA, "Camera permission is needed to click images.", REQUEST_CAMERA_ACCESS_PERMISSION);
        } else {
            Intent takePictureIntent = new Intent(MediaStore.ACTION_IMAGE_CAPTURE);
            try {
                if (takePictureIntent.resolveActivity(getPackageManager()) != null) {
                    //CustomFile customFile = FileUtil.getFileToSave(svContext, FileUtil.getFileName("jpg"), FileUtil.MediaType.Image);
                    imageUri = MyCache.getInstance().getUriByFileName(FileUtil.getFileName("png"), svContext);
                    takePictureIntent.putExtra(MediaStore.EXTRA_OUTPUT, imageUri);
                    startActivityForResult(takePictureIntent, TAKE_PICTURE);
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
    }

    private void ShowUploadDialog() {
        rlayImageSelect.setVisibility(View.VISIBLE);
    }

    private void HideUploadDialog() {
        rlayImageSelect.setVisibility(View.GONE);
    }

    private void startCrop(@NonNull Uri uri) {
        try {
            String destinationFileName = SAMPLE_CROPPED_IMAGE_NAME + GlobalData.getUniqueString();
            destinationFileName += ".jpg";

            UCrop uCrop = UCrop.of(uri, Uri.fromFile(new File(getCacheDir(), destinationFileName)));
            uCrop = basisConfig(uCrop);
            uCrop = advancedConfig(uCrop);
            uCrop.start(ActivityBrowseGallery.this);
        } catch (Exception e) {
            e.printStackTrace();
            Log.e("startCrop", e.toString());
        }
    }

    /**
     * In most cases you need only to set crop aspect ration and max size for resulting image.
     *
     * @param uCrop - ucrop builder instance
     * @return - ucrop builder instance
     */
    private UCrop basisConfig(@NonNull UCrop uCrop) {
//        uCrop = uCrop.useSourceImageAspectRatio();
        uCrop = uCrop.withAspectRatio(3, 2);
        uCrop = uCrop.withMaxResultSize(600, 600);

        return uCrop;
    }

    /**
     * Sometimes you want to adjust more options, it's done via {@link UCrop.Options} class.
     *
     * @param uCrop - ucrop builder instance
     * @return - ucrop builder instance
     */
    private UCrop advancedConfig(@NonNull UCrop uCrop) {
        UCrop.Options options = new UCrop.Options();

//        options.setCompressionFormat(Bitmap.CompressFormat.PNG);
        options.setCompressionFormat(Bitmap.CompressFormat.JPEG);
        options.setCompressionQuality(100); //From 1 to 100
        options.setHideBottomControls(false);
        options.setFreeStyleCropEnabled(true);
//        options.setMaxScaleMultiplier(5);
//        options.setImageToCropBoundsAnimDuration(666);
//        options.setDimmedLayerColor(Color.CYAN);
        options.setCircleDimmedLayer(true);

        /*
        If you want to configure how gestures work for all UCropActivity tabs
        options.setAllowedGestures(UCropActivity.SCALE, UCropActivity.ROTATE, UCropActivity.ALL);
        * */

        /*
        This sets max size for bitmap that will be decoded from source Uri.
        More size - more memory allocation, default implementation uses screen diagonal.
        options.setMaxBitmapSize(640);
        * */


       /*
        Tune everything (ﾉ◕ヮ◕)ﾉ*:･ﾟ✧
        options.setMaxScaleMultiplier(5);
        options.setImageToCropBoundsAnimDuration(666);
        options.setDimmedLayerColor(Color.CYAN);
        options.setCircleDimmedLayer(true);
        options.setShowCropFrame(false);
        options.setCropGridStrokeWidth(20);
        options.setCropGridColor(Color.GREEN);
        options.setCropGridColumnCount(2);
        options.setCropGridRowCount(1);
        options.setToolbarCropDrawable(R.drawable.your_crop_icon);
        options.setToolbarCancelDrawable(R.drawable.your_cancel_icon);

        // Color palette
        options.setToolbarColor(ContextCompat.getColor(this, R.color.your_color_res));
        options.setStatusBarColor(ContextCompat.getColor(this, R.color.your_color_res));
        options.setActiveWidgetColor(ContextCompat.getColor(this, R.color.your_color_res));
        options.setToolbarWidgetColor(ContextCompat.getColor(this, R.color.your_color_res));
        options.setRootViewBackgroundColor(ContextCompat.getColor(this, R.color.your_color_res));

        // Aspect ratio options
        options.setAspectRatioOptions(1,
            new AspectRatio("WOW", 1, 2),
            new AspectRatio("MUCH", 3, 4),
            new AspectRatio("RATIO", CropImageView.DEFAULT_ASPECT_RATIO, CropImageView.DEFAULT_ASPECT_RATIO),
            new AspectRatio("SO", 16, 9),
            new AspectRatio("ASPECT", 1, 1));

       */
        return uCrop.withOptions(options);
    }

    private void handleCropResult(@NonNull Intent result) {
        imageUri = UCrop.getOutput(result);
        if (imageUri != null) {
//            ActivityRegister fragment = new ActivityRegister();
//            (fragment).SetProfilePic(svContext);
//            finish();
            onBackPressed();
        } else {
            customToast.showCustomToast(svContext, getResources().getString(R.string.toast_cannot_retrieve_cropped_image), customToast.ToastyInfo);
        }
    }

    @SuppressWarnings("ThrowableResultOfMethodCallIgnored")
    private void handleCropError(@NonNull Intent result) {
        final Throwable cropError = UCrop.getError(result);
        if (cropError != null) {
            customToast.showCustomToast(svContext, cropError.getMessage(), customToast.ToastyError);
        } else {
            customToast.showCustomToast(svContext, getResources().getString(R.string.toast_unexpected_error), customToast.ToastyInfo);
        }
    }

    @Override
    public void loadingProgress(boolean showLoader) {
        mShowLoader = showLoader;
        supportInvalidateOptionsMenu();
    }

    @Override
    public void onCropFinish(UCropFragment.UCropResult result) {
        switch (result.mResultCode) {
            case RESULT_OK:
                handleCropResult(result.mResultData);
                break;
            case UCrop.RESULT_ERROR:
                handleCropError(result.mResultData);
                break;
        }
        removeFragmentFromScreen();
    }

    public void removeFragmentFromScreen() {
        getSupportFragmentManager().beginTransaction()
                .remove(fragment)
                .commit();
        toolbar.setVisibility(View.GONE);
//        settingsView.setVisibility(View.VISIBLE);
    }

//    public void setupFragment(UCrop uCrop) {
//        fragment = uCrop.getFragment(uCrop.getIntent(this).getExtras());
//        getSupportFragmentManager().beginTransaction()
//                .add(R.id.fragment_container, fragment, UCropFragment.TAG)
//                .commitAllowingStateLoss();
//
//        setupViews(uCrop.getIntent(this).getExtras());
//    }

    public void setupViews(Bundle args) {
//        settingsView.setVisibility(View.GONE);
        mStatusBarColor = args.getInt(UCrop.Options.EXTRA_STATUS_BAR_COLOR, ContextCompat.getColor(this, R.color.ucrop_color_statusbar));
        mToolbarColor = args.getInt(UCrop.Options.EXTRA_TOOL_BAR_COLOR, ContextCompat.getColor(this, R.color.ucrop_color_toolbar));
        mToolbarCancelDrawable = args.getInt(UCrop.Options.EXTRA_UCROP_WIDGET_CANCEL_DRAWABLE, R.drawable.ucrop_ic_cross);
        mToolbarCropDrawable = args.getInt(UCrop.Options.EXTRA_UCROP_WIDGET_CROP_DRAWABLE, R.drawable.ucrop_ic_done);
        mToolbarWidgetColor = args.getInt(UCrop.Options.EXTRA_UCROP_WIDGET_COLOR_TOOLBAR, ContextCompat.getColor(this, R.color.ucrop_color_toolbar_widget));
        mToolbarTitle = args.getString(UCrop.Options.EXTRA_UCROP_TITLE_TEXT_TOOLBAR);
        mToolbarTitle = mToolbarTitle != null ? mToolbarTitle : getResources().getString(R.string.ucrop_label_edit_photo);

        setupAppBar();
    }

    private String strPostText = "";

    @Override
    public void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (resultCode == RESULT_OK) {
            if (requestCode == UCrop.REQUEST_CROP) {
                handleCropResult(data);
            } else if (requestCode == TAKE_PICTURE) {
                startCrop(imageUri);
            } else if (resultCode == UCrop.RESULT_ERROR) {
                handleCropError(data);
            } else {
                final Uri selectedUri = imageUri;
                if (selectedUri != null) {
                    startCrop(selectedUri);
                } else {
                    customToast.showCustomToast(svContext, getResources().getString(R.string.toast_cannot_retrieve_selected_image), customToast.ToastyError);
                }
            }
        } else {
            imageUri = null;
        }
    }

    private Uri getImageUri(Context context, Bitmap inImage) {
        ByteArrayOutputStream bytes = new ByteArrayOutputStream();
        inImage.compress(Bitmap.CompressFormat.JPEG, 100, bytes);
        String path = MediaStore.Images.Media.insertImage(context.getContentResolver(), inImage, "Title", null);
        return Uri.parse(path);
    }

    /**
     * Requests given permission.
     * If the permission has been denied previously, a Dialog will prompt the user to grant the
     * permission, otherwise it is requested directly.
     */
    protected void requestPermission(final String permission, String rationale, final int requestCode) {
        if (ActivityCompat.shouldShowRequestPermissionRationale(this, permission)) {
            showAlertDialog(getString(R.string.permission_title_rationale), rationale,
                    new DialogInterface.OnClickListener() {
                        @Override
                        public void onClick(DialogInterface dialog, int which) {
                            ActivityCompat.requestPermissions(ActivityBrowseGallery.this, new String[]{permission}, requestCode);
                        }
                    }, getString(R.string.label_ok), null, getString(R.string.label_cancel));
        } else {
            ActivityCompat.requestPermissions(this, new String[]{permission}, requestCode);
        }
    }

    /**
     * This method shows dialog with given title & message.
     * Also there is an option to pass onClickListener for positive & negative button.
     *
     * @param title                         - dialog title
     * @param message                       - dialog message
     * @param onPositiveButtonClickListener - listener for positive button
     * @param positiveText                  - positive button text
     * @param onNegativeButtonClickListener - listener for negative button
     * @param negativeText                  - negative button text
     */
    protected void showAlertDialog(@Nullable String title, @Nullable String message,
                                   @Nullable DialogInterface.OnClickListener onPositiveButtonClickListener,
                                   @NonNull String positiveText,
                                   @Nullable DialogInterface.OnClickListener onNegativeButtonClickListener,
                                   @NonNull String negativeText) {
        AlertDialog.Builder builder = new AlertDialog.Builder(this);
        builder.setTitle(title);
        builder.setMessage(message);
        builder.setPositiveButton(positiveText, onPositiveButtonClickListener);
        builder.setNegativeButton(negativeText, onNegativeButtonClickListener);
        mAlertDialog = builder.show();
    }

    /**
     * Callback received when a permissions request has been completed.
     */
    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
        switch (requestCode) {
            case REQUEST_STORAGE_READ_ACCESS_PERMISSION:
                if (grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                    AsyncTask.execute(new Runnable() {
                        @Override
                        public void run() {
                            browseImageFromGallery();
                        }
                    });
                }
                break;
            case REQUEST_CAMERA_ACCESS_PERMISSION:
                if (grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                    browseImageFromCamera();
                }
                break;
            case REQUEST_STORAGE_WRITE_ACCESS_PERMISSION:
                if (grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                    browseImageFromCamera();
                }
                break;
            default:
                super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        }
    }


    @Override
    public void onBackPressed() {
        super.onBackPressed();
        finish();
    }

    /**
     * Configures and styles both status bar and toolbar.
     */
    private void setupAppBar() {
        setStatusBarColor(mStatusBarColor);
        toolbar = findViewById(R.id.toolbar);

        // Set all of the Toolbar coloring
        toolbar.setBackgroundColor(mToolbarColor);
        toolbar.setTitleTextColor(mToolbarWidgetColor);
        toolbar.setVisibility(View.VISIBLE);
        final TextView toolbarTitle = toolbar.findViewById(R.id.toolbar_title);
        toolbarTitle.setTextColor(mToolbarWidgetColor);
        toolbarTitle.setText(mToolbarTitle);

        // Color buttons inside the Toolbar
        Drawable stateButtonDrawable = ContextCompat.getDrawable(getBaseContext(), mToolbarCancelDrawable);
        if (stateButtonDrawable != null) {
            stateButtonDrawable.mutate();
            stateButtonDrawable.setColorFilter(mToolbarWidgetColor, PorterDuff.Mode.SRC_ATOP);
            toolbar.setNavigationIcon(stateButtonDrawable);
        }

        setSupportActionBar(toolbar);
        final ActionBar actionBar = getSupportActionBar();
        if (actionBar != null) {
            actionBar.setDisplayShowTitleEnabled(false);
        }
    }

    /**
     * Sets status-bar color for L devices.
     *
     * @param color - status-bar color
     */
    @TargetApi(Build.VERSION_CODES.LOLLIPOP)
    private void setStatusBarColor(@ColorInt int color) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            final Window window = getWindow();
            if (window != null) {
                window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
                window.setStatusBarColor(color);
            }
        }
    }

    @Override
    public boolean onCreateOptionsMenu(final Menu menu) {
        getMenuInflater().inflate(R.menu.ucrop_menu_activity, menu);

        // Change crop & loader menu icons color to match the rest of the UI colors

        MenuItem menuItemLoader = menu.findItem(R.id.menu_loader);
        Drawable menuItemLoaderIcon = menuItemLoader.getIcon();
        if (menuItemLoaderIcon != null) {
            try {
                menuItemLoaderIcon.mutate();
                menuItemLoaderIcon.setColorFilter(mToolbarWidgetColor, PorterDuff.Mode.SRC_ATOP);
                menuItemLoader.setIcon(menuItemLoaderIcon);
            } catch (IllegalStateException e) {
                Log.i(this.getClass().getName(), String.format("%s - %s", e.getMessage(), getString(R.string.ucrop_mutate_exception_hint)));
            }
            ((Animatable) menuItemLoader.getIcon()).start();
        }

        MenuItem menuItemCrop = menu.findItem(R.id.menu_crop);
        Drawable menuItemCropIcon = ContextCompat.getDrawable(this, mToolbarCropDrawable);
        if (menuItemCropIcon != null) {
            menuItemCropIcon.mutate();
            menuItemCropIcon.setColorFilter(mToolbarWidgetColor, PorterDuff.Mode.SRC_ATOP);
            menuItemCrop.setIcon(menuItemCropIcon);
        }

        return true;
    }

    @Override
    public boolean onPrepareOptionsMenu(Menu menu) {
        menu.findItem(R.id.menu_crop).setVisible(!mShowLoader);
        menu.findItem(R.id.menu_loader).setVisible(mShowLoader);
        return super.onPrepareOptionsMenu(menu);
    }

    @Override
    public boolean onOptionsItemSelected(MenuItem item) {
        if (item.getItemId() == R.id.menu_crop) {
            if (fragment.isAdded())
                fragment.cropAndSaveImage();
        } else if (item.getItemId() == android.R.id.home) {
            removeFragmentFromScreen();
        }
        return super.onOptionsItemSelected(item);
    }

    public static void OpenBrowseActivity(Context con) {
        checkPermissions(con, new PermissionHandler() {
            @Override
            public void onGranted(ArrayList<String> grantedPermissions) {
                ActivityBrowseGallery.imageUri = null;
                Intent svIntent = new Intent(con, ActivityBrowseGallery.class);
                con.startActivity(svIntent);
            }
        });
    }

    /**
     * Check for required app permissions
     */
    public static void checkPermissions(Context context, PermissionHandler permissionHandler) {
        String[] permissionNeeded = new String[]{
                Manifest.permission.CAMERA, Manifest.permission.READ_EXTERNAL_STORAGE, Manifest.permission.WRITE_EXTERNAL_STORAGE};

        Permissions.Options permissionsOptions = new Permissions.Options()
                .setRationaleDialogTitle("Info")
                .setSettingsDialogTitle("Warning");

        String strNeedPermission = "Need some Permissions";
        String strRationale = "This app needs permission to work properly.";
        Permissions.check(context, permissionNeeded, strRationale, permissionsOptions, permissionHandler);
    }

}
