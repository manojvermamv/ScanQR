package com.anubhav.scanqr;

import android.Manifest;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;
import android.view.View;

import androidx.annotation.NonNull;
import androidx.core.app.ActivityCompat;

import com.anubhav.commonutility.CustomToast;
import com.anubhav.scanqr.databinding.ActQrScanBinding;
import com.budiyev.android.codescanner.CodeScanner;
import com.budiyev.android.codescanner.DecodeCallback;
import com.google.zxing.BinaryBitmap;
import com.google.zxing.MultiFormatReader;
import com.google.zxing.NotFoundException;
import com.google.zxing.RGBLuminanceSource;
import com.google.zxing.Result;
import com.google.zxing.common.HybridBinarizer;

import java.io.FileNotFoundException;
import java.io.InputStream;

import gun0912.tedbottompicker.TedBottomPicker;
import gun0912.tedbottompicker.TedBottomSheetDialogFragment;

public class QrScanActivity extends BaseActivity<ActQrScanBinding> implements View.OnClickListener {

    private static final String TAG = QrScanActivity.class.getSimpleName();

    public static void start(Context context) {
        Intent intent = new Intent(context, QrScanActivity.class);
        context.startActivity(intent);
    }

    @Override
    protected int getLayoutResourceId() {
        return R.layout.act_qr_scan;
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        //GlobalData.setStatusBarFullScreen(this);
        //GlobalData.setLightStatusBar(this);

        onCreateApp();
        onResumeApp();
    }

    private CodeScanner mCodeScanner;

    private void onCreateApp() {
        // action bar initialization
        binding.imgClose.setOnClickListener(view -> finish());
    }

    public void onResumeApp() {
        mCodeScanner = new CodeScanner(this, binding.scannerView);
        mCodeScanner.setDecodeCallback(new DecodeCallback() {
            @Override
            public void onDecoded(@NonNull final Result result) {
                runOnUiThread(() -> {
                    showScanResultDialog(result.getText());
                });
            }
        });

        binding.scannerView.setOnClickListener(view -> mCodeScanner.startPreview());
        binding.browseQrcode.setOnClickListener(view -> ScanImageFromGallery());
    }

    @Override
    public void onClick(View v) {
    }

    @Override
    protected void onResume() {
        super.onResume();
        mCodeScanner.startPreview();
    }

    @Override
    protected void onPause() {
        mCodeScanner.releaseResources();
        super.onPause();
    }

    protected Result GetBarcodeText(Uri imgUri) {
        try {
            InputStream inputStream = getContentResolver().openInputStream(imgUri);
            Bitmap bitmap = BitmapFactory.decodeStream(inputStream);
            if (bitmap == null) {
                Log.e(TAG, "uri is not a bitmap," + imgUri.toString());
                return null;
            }
            int width = bitmap.getWidth(), height = bitmap.getHeight();
            int[] pixels = new int[width * height];
            bitmap.getPixels(pixels, 0, width, 0, 0, width, height);
            bitmap.recycle();
            bitmap = null;
            RGBLuminanceSource source = new RGBLuminanceSource(width, height, pixels);
            BinaryBitmap bBitmap = new BinaryBitmap(new HybridBinarizer(source));
            MultiFormatReader reader = new MultiFormatReader();
            try {
                return reader.decode(bBitmap);
            } catch (NotFoundException e) {
                Log.e(TAG, "decode exception", e);
                return null;
            }
        } catch (FileNotFoundException e) {
            Log.e(TAG, "can not open file" + imgUri.toString(), e);
            return null;
        }
    }

    public void ScanImageFromGallery() {
        if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.Q && ActivityCompat.checkSelfPermission(this, Manifest.permission.READ_EXTERNAL_STORAGE) != PackageManager.PERMISSION_GRANTED) {
            checkPermissions();
        } else {
            if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.Q && ActivityCompat.checkSelfPermission(this, Manifest.permission.WRITE_EXTERNAL_STORAGE) != PackageManager.PERMISSION_GRANTED) {
                checkPermissions();
            } else {
                TedBottomPicker.with(this)
                        .show(new TedBottomSheetDialogFragment.OnImageSelectedListener() {
                            @Override
                            public void onImageSelected(Uri uri) {
                                Result result = GetBarcodeText(uri);
                                if (result == null) {
                                    customToast.showToast("QR not found in image!", CustomToast.ToastyError);
                                } else {
                                    showScanResultDialog(result.getText());
                                }
                            }
                        });
            }
        }
    }

}