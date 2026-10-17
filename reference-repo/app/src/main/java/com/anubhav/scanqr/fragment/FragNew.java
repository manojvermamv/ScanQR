package com.anubhav.scanqr.fragment;

import android.os.Bundle;
import android.view.View;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.anubhav.scanqr.BaseFragment;
import com.anubhav.scanqr.R;
import com.anubhav.scanqr.databinding.FragNewBinding;


public class FragNew extends BaseFragment<FragNewBinding> {

    public FragNew() {
    }

    @Override
    protected int getFragmentLayout() {
        return R.layout.frag_new;
    }

    @Override
    protected void initView(View view) {
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);
        StartApp();
        resumeApp();
    }

    @Override
    public void onClick(View v) {
        switch (v.getId()) {
            case R.id.img_back:
                hideFragKeyboard();
                break;
            default:
                break;
        }
    }

    public void resumeApp() {
    }

}