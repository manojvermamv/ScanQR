package com.anubhav.commonutility.spinner;

import android.app.Activity;
import android.app.SearchManager;
import android.content.Context;
import android.content.Intent;
import android.graphics.Typeface;
import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import android.view.inputmethod.InputMethodManager;
import android.widget.EditText;
import android.widget.ImageView;
import android.widget.ProgressBar;
import android.widget.TextView;

import androidx.appcompat.app.AppCompatActivity;
import androidx.appcompat.widget.SearchView;
import androidx.recyclerview.widget.DefaultItemAnimator;
import androidx.recyclerview.widget.DividerItemDecoration;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.anubhav.commonutility.MyDividerItemDecoration;
import com.anubhav.commonutility.CustomToast;
import com.anubhav.commonutility.customfont.FontUtils;
import com.anubhav.scanqr.R;
import com.anubhav.scanqr.utils.Global;
import com.anubhav.scanqr.utils.GlobalData;
import com.anubhav.scanqr.utils.Preferences;

import java.util.List;

import me.grantland.widget.AutofitTextView;

public class ActivitySpinner extends AppCompatActivity implements View.OnClickListener, SpinnerAdapter.OnItemClickListener {
    private final View[] allViewWithClick = {};
    private final int[] allViewWithClickId = {0};

    private final EditText[] edTexts = {};
    private final String[] edTextsError = {};
    private final int[] editTextsClickId = {0};

    private ProgressBar progressbarLoad;
    private SpinnerAdapter mAdapter;

    boolean isImageShow = true;
    private String title = "";
    private static List<SpinnerModel> itemList;
    private static final String TAG = ActivitySpinner.class.getSimpleName();

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.act_custom_spinner);
        if (getIntent() != null && getIntent().hasExtra("title")) {
            title = getIntent().getStringExtra("title");
        }

        StartApp();
        OnClickCombineDeclare(allViewWithClick);
        EditTextDeclare(edTexts);

        resumeApp();
    }

    private String firstLetterInUpperCase(String str) {
        try {
            String firstLetStr = str.substring(0, 1);
            String remLetStr = str.substring(1).toLowerCase();
            firstLetStr = firstLetStr.toUpperCase();
            String firstLetterCapitalizedName = firstLetStr + remLetStr;
            return firstLetterCapitalizedName;
        } catch (Exception ignored) {
            return str;
        }
    }

    public void resumeApp() {
        AutofitTextView txtHeading = (AutofitTextView) findViewById(R.id.heading);
        txtHeading.setText(title);

        mAdapter = new SpinnerAdapter(svContext, itemList, this, isImageShow, false);

        // Associate searchable configuration with the SearchView
        SearchManager searchManager = (SearchManager) getSystemService(Context.SEARCH_SERVICE);
        SearchView searchView = (SearchView) findViewById(R.id.searchview);
        searchView.setSearchableInfo(searchManager.getSearchableInfo(getComponentName()));
        searchView.setMaxWidth(Integer.MAX_VALUE);

        // listening to search query text change
        searchView.setOnQueryTextListener(new SearchView.OnQueryTextListener() {
            @Override
            public boolean onQueryTextSubmit(String query) {
                // filter recycler view when query submitted
                mAdapter.getFilter().filter(query);
                return false;
            }

            @Override
            public boolean onQueryTextChange(String query) {
                // filter recycler view when text is changed
                mAdapter.getFilter().filter(query);
                return false;
            }
        });


        RecyclerView recyclerView = (RecyclerView) findViewById(R.id.recycler_view);
        recyclerView.setLayoutManager(new LinearLayoutManager(getApplicationContext()));
        recyclerView.setItemAnimator(new DefaultItemAnimator());
        recyclerView.addItemDecoration(new MyDividerItemDecoration(this, DividerItemDecoration.VERTICAL, 30));
        recyclerView.setAdapter(mAdapter);
        progressbarLoad.setVisibility(View.GONE);

        if (itemList.size() == 0) {
            CustomToast.showCustomToast(svContext, "No items to show", CustomToast.ToastyError);
            onBackPressed();
        }
    }


    private void EditTextDeclare(EditText[] editTexts) {
        for (int j = 0; j < editTexts.length; j++) {
            editTexts[j] = findViewById(editTextsClickId[j]);
        }
    }

    private void OnClickCombineDeclare(View[] allViewWithClick) {
        for (int j = 0; j < allViewWithClick.length; j++) {
            allViewWithClick[j] = findViewById(allViewWithClickId[j]);
            allViewWithClick[j].setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View v) {
                    switch (v.getId()) {
                    }
                }
            });
        }
    }


    private Context svContext;
    private CustomToast customToast;

    private void StartApp() {
        svContext = this;
        customToast = new CustomToast(svContext);
        ViewGroup root = (ViewGroup) findViewById(R.id.root_view);
        if (!Global.CUSTOMFONTNAME.equals("")) {
            Typeface font = Typeface.createFromAsset(getAssets(), Global.CUSTOMFONTNAME);
            FontUtils.setFont(root, font);
        }
        if (Preferences.readBoolean(svContext, Preferences.IS_DARKTHEME, false)) {
            //FontUtils.setThemeColor(root, svContext, true);
        } else {
            //FontUtils.setThemeColor(root, svContext, false);
        }

        hideKeyboard();
        GlobalData.SetLanguage(svContext);

        loadToolBar();

        progressbarLoad = (ProgressBar) findViewById(R.id.progressbar_load);
        progressbarLoad.setVisibility(View.VISIBLE);
    }

    private void loadToolBar() {
        ImageView imgToolBarBack = (ImageView) findViewById(R.id.img_back);
        imgToolBarBack.setOnClickListener(this);

        TextView txtHeading = (TextView) findViewById(R.id.heading);
        txtHeading.setText(getString(R.string.app_name));
    }

    @Override
    protected void onResume() {
        super.onResume();
    }

    @Override
    public void onClick(View v) {
        switch (v.getId()) {
            case R.id.img_back:
                hideKeyboard();
                finish();
                break;
            default:
                break;
        }
    }

    private void hideKeyboard() {
        InputMethodManager inputManager = (InputMethodManager) this.getSystemService(Context.INPUT_METHOD_SERVICE);
        // check if no view has focus:
        View view = this.getCurrentFocus();
        if (view != null) {
            inputManager.hideSoftInputFromWindow(view.getWindowToken(), InputMethodManager.HIDE_NOT_ALWAYS);
        }
    }

    @Override
    public void onBackPressed() {
        hideKeyboard();
        super.onBackPressed();
    }

    @Override
    public void onItemClick(View view, SpinnerModel selectedSpinnerModel, int position) {
        itemList = null;
        setResultIntent(selectedSpinnerModel, position);
    }

    public static String EXTRA_SPINNER_DATA = "spinner_data";
    public static String EXTRA_SPINNER_POSITION = "spinner_position";

    public void setResultIntent(SpinnerModel spinnerData, int position) {
        Intent intent = new Intent();
        intent.putExtra(EXTRA_SPINNER_DATA, spinnerData);
        intent.putExtra(EXTRA_SPINNER_POSITION, position);
        setResult(RESULT_OK, intent);
        finish();
    }

    /**
     * Open Custom Spinner Activity directly from here
     */
    public static void showSpinner(Context context, List<SpinnerModel> listSpinner, int request_code) {
        showSpinner(context, listSpinner, "Select Item", request_code);
    }

    public static void showSpinner(Context context, List<SpinnerModel> listSpinner, String spinnerTitle, int request_code) {
        itemList = listSpinner;
        Intent intent = new Intent(context, ActivitySpinner.class);
        intent.putExtra("title", spinnerTitle);
        ((Activity) context).startActivityForResult(intent, request_code);
    }

}