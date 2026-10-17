package com.anubhav.scanqr.dailog;

import android.app.Activity;
import android.app.SearchManager;
import android.content.Context;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.appcompat.widget.SearchView;

import com.google.android.material.bottomsheet.BottomSheetDialogFragment;
import com.google.android.material.floatingactionbutton.FloatingActionButton;
import com.anubhav.commonutility.customfont.FontUtils;
import com.anubhav.scanqr.R;
import com.anubhav.scanqr.interfaces.BottomSheetDialogFragmentCallback;

public class SearchBottomSheetDialog extends BottomSheetDialogFragment {

    private String mQuery = "";
    private SearchView searchView;
    public static final String TAG = SearchBottomSheetDialog.class.getSimpleName();

    private final Context context;
    private final Bundle bundle;
    private final BottomSheetDialogFragmentCallback<SearchBottomSheetDialog> mBottomDialogListener;

    public SearchBottomSheetDialog(Context context, Bundle bundle, BottomSheetDialogFragmentCallback<SearchBottomSheetDialog> bottomDialogListener) {
        this.context = context;
        this.bundle = bundle;
        this.mBottomDialogListener = bottomDialogListener;
    }

    @Override
    public void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setStyle(STYLE_NORMAL, R.style.BottomSheetTheme);
    }

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        View view = inflater.inflate(R.layout.bs_search, container, false);

        ViewGroup rootView = view.findViewById(R.id.root_view);
        FontUtils.setFont(context, rootView);

        searchView = view.findViewById(R.id.search_view);
        FloatingActionButton btnCheck = view.findViewById(R.id.btn_check);
        btnCheck.setOnClickListener(v -> setResult());

        return view;
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);

        mQuery = bundle.getString(TAG);

        // Associate searchable configuration with the SearchView
        SearchManager searchManager = (SearchManager) context.getSystemService(Context.SEARCH_SERVICE);
        searchView.setSearchableInfo(searchManager.getSearchableInfo(((Activity) context).getComponentName()));
        searchView.setMaxWidth(Integer.MAX_VALUE);
        searchView.setOnQueryTextListener(new SearchView.OnQueryTextListener() {
            @Override
            public boolean onQueryTextSubmit(String query) {
                // filter recycler view when query submitted
                mQuery = query;
                setResult();
                return true;
            }

            @Override
            public boolean onQueryTextChange(String query) {
                // filter recycler view when text is changed
                mQuery = query;
                return true;
            }
        });
        searchView.setQuery(mQuery, true);

    }

    private void setResult() {
        Bundle bundle = new Bundle();
        bundle.putString(TAG, mQuery);
        mBottomDialogListener.onBottomDialogCallback(this, bundle);
        dismiss();
    }

}
