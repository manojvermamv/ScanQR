package com.anubhav.scanqr;

import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.view.inputmethod.InputMethodManager;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.databinding.DataBindingUtil;
import androidx.databinding.ViewDataBinding;
import androidx.fragment.app.Fragment;

import com.anubhav.commonutility.CustomToast;
import com.anubhav.commonutility.customfont.FontUtils;
import com.anubhav.scanqr.utils.GlobalData;

public abstract class BaseFragment<T extends ViewDataBinding> extends Fragment implements View.OnClickListener {

    public T binding;

    protected abstract int getFragmentLayout();

    protected abstract void initView(View view);

    @NonNull
    @Override
    public final View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        super.onCreateView(inflater, container, savedInstanceState);
        binding = DataBindingUtil.inflate(inflater, getFragmentLayout(), container, false);
        //binding.setLifecycleOwner(getViewLifecycleOwner());

        View fragView = binding.getRoot();
        initView(fragView);
        return fragView;
    }

    @Override
    public void onDestroyView() {
        super.onDestroyView();
        binding = null;
    }

    public CustomToast getToast() {
        return new CustomToast(requireContext());
    }

    public void StartApp() {
        ViewGroup root = getView().findViewById(R.id.mylayout);
        FontUtils.setFont(requireContext(), root);
        GlobalData.SetLanguage(requireContext());
    }

    public void switchContent(Fragment fragment) {
        hideFragKeyboard();
        requireActivity().getSupportFragmentManager()
                .beginTransaction()
                .replace(R.id.container, fragment)
                .commit();
    }

    public void switchContent(Fragment fragment, String tag) {
        hideFragKeyboard();
        requireActivity().getSupportFragmentManager()
                .beginTransaction()
                .replace(R.id.container, fragment)
                .addToBackStack(tag)
                .commit();
    }

    public void hideKeyboard() {
        InputMethodManager inputManager = (InputMethodManager) requireContext().getSystemService(Context.INPUT_METHOD_SERVICE);
        // check if no view has focus
        View view = requireActivity().getCurrentFocus();
        if (view != null) {
            inputManager.hideSoftInputFromWindow(view.getWindowToken(), InputMethodManager.HIDE_NOT_ALWAYS);
        }
    }

    public void hideFragKeyboard() {
        InputMethodManager inputManager = (InputMethodManager) requireContext().getSystemService(Context.INPUT_METHOD_SERVICE);
        inputManager.hideSoftInputFromWindow(getView().getWindowToken(), 0);
    }

    private void startNewActivity(Class<?> cls) {
        Intent intent = new Intent(requireContext(), cls);
        startActivity(intent);
    }

//    int[] strAds = {R.drawable.banner1, R.drawable.banner2, R.drawable.banner3};
//    private void LoadAds() {
//        RecyclerView rvDashShopAds = (RecyclerView) fragView.findViewById(R.id.rv_offers);
//        List<SliderItem> imgAds = new ArrayList<>();
//        LinearLayoutManager layoutManager = new LinearLayoutManager(svContext, LinearLayoutManager.HORIZONTAL, false);
//        rvDashShopAds.setLayoutManager(layoutManager);
//        rvDashShopAds.setHasFixedSize(true);
//        int animation_type = ItemAnimation.LEFT_RIGHT;
//        ImageShoppingAds adapter = new ImageShoppingAds(svContext, imgAds, ItemAnimation.NONE);
//        for (int j = 0; j < strAds.length; j++) {
//            imgAds.add(new SliderItem(j + "", "name_" + j, "desc_" + j,
//                    strAds[j]));
//        }
//        rvDashShopAds.setAdapter(adapter);
//    }

}
