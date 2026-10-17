package com.anubhav.scanqr.interfaces;

import android.os.Bundle;

import com.google.android.material.bottomsheet.BottomSheetDialogFragment;

public interface BottomSheetDialogFragmentCallback<T extends BottomSheetDialogFragment> {

    void onBottomDialogCallback(T dialog, Bundle bundle);

}