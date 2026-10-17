//package com.anubhav.commonutility.views;
//
//import android.content.Context;
//import android.content.res.Resources;
//import android.os.Message;
//import android.view.View;
//import android.widget.Button;
//import android.widget.EditText;
//import android.widget.Spinner;
//
//import androidx.annotation.NonNull;
//import androidx.appcompat.app.AlertDialog;
//
//import com.codunite.paysall.R;
//
//import java.text.MessageFormat;
//import java.util.ArrayList;
//
//public class CustomAppDialog extends AlertDialog {
//
////    protected CustomAppDialog(@NonNull Context context) {
////        super(context);
////    }
//
//    // File kinds - these should correspond to the order in which
//    // they're presented in the spinner control
//    public static final int FILE_KIND_MUSIC = 0;
//    public static final int FILE_KIND_ALARM = 1;
//    public static final int FILE_KIND_NOTIFICATION = 2;
//    public static final int FILE_KIND_RINGTONE = 3;
//
//    private final Spinner mTypeSpinner;
//    private final EditText mFilename;
//    private final Message mResponse;
//    private final String mOriginalName;
//    private final ArrayList<String> mTypeArray;
//    private int mPreviousSelection;
//
//    public CustomAppDialog(Context context, Resources resources, String originalName, Message response) {
//        super(context, R.style.DialogStyle);
//
//        //setContentView(R.layout.dialog_file_save);
//        //getWindow().setLayout(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
//        //getWindow().setBackgroundDrawableResource(R.drawable.custom_dialog_background);
//
//        //setTitle(resources.getString(R.string.save_as));
//        //setCancelable(true);
//        //setCanceledOnTouchOutside(true);
//
//        Button okBtn = (Button) findViewById(R.id.confirm_button);
//        okBtn.setOnClickListener(new View.OnClickListener() {
//            @Override
//            public void onClick(View view) {
//                mResponse.obj = mFilename.getText();
//                mResponse.arg1 = mTypeSpinner.getSelectedItemPosition();
//                mResponse.sendToTarget();
//                dismiss();
//            }
//        });
//
//        Button cancel = (Button) findViewById(R.id.cancel_button);
//        cancel.setOnClickListener(view -> dismiss());
//
//        mResponse = response;
//    }
//
//
//    public static String KindToName(int kind) {
//        switch (kind) {
//            default:
//                return "Unknown";
//            case FILE_KIND_MUSIC:
//                return "Music";
//            case FILE_KIND_ALARM:
//                return "Alarm";
//            case FILE_KIND_NOTIFICATION:
//                return "Notification";
//            case FILE_KIND_RINGTONE:
//                return "Ringtone";
//        }
//    }
//
//    private void setFilenameEditBoxFromName(boolean onlyIfNotEdited) {
//        if (onlyIfNotEdited) {
//            CharSequence currentText = mFilename.getText();
//            String expectedText = mOriginalName + "_" + mTypeArray.get(mPreviousSelection);
//
//            if (!expectedText.contentEquals(currentText)) {
//                return;
//            }
//        }
//
//        int newSelection = mTypeSpinner.getSelectedItemPosition();
//        String newSuffix = mTypeArray.get(newSelection);
//        mFilename.setText(MessageFormat.format("{0}_{1}", mOriginalName, newSuffix));
//        mPreviousSelection = mTypeSpinner.getSelectedItemPosition();
//    }
//
//}