package com.anubhav.scanqr;

import android.content.Context;
import android.os.Bundle;
import android.text.TextUtils;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Filter;
import android.widget.Filterable;

import androidx.annotation.NonNull;
import androidx.cardview.widget.CardView;
import androidx.core.content.ContextCompat;
import androidx.recyclerview.widget.DiffUtil;
import androidx.recyclerview.widget.RecyclerView;

import com.anubhav.scanqr.interfaces.ItemClickListener;
import com.anubhav.scanqr.utils.GlobalData;
import com.anubhav.scanqr.utils.ItemAnimation;

import java.util.ArrayList;
import java.util.List;


/**
 * Created by Manoj Verma on 26/3/2022.
 */
public abstract class BaseRecyclerAdapter<T> extends RecyclerView.Adapter<BaseRecyclerAdapter.ViewHolder<T>> implements Filterable {

    private final String TAG = BaseRecyclerAdapter.class.getSimpleName();
    private final Context context;
    private final Class<T> tClass;
    private final int[] colors = {R.color.red_600, R.color.indigo_600, R.color.light_blue_600, R.color.green_600, R.color.amber_600, R.color.deep_orange_600,
            R.color.blue_grey_600, R.color.cyan_600, R.color.light_green_600, R.color.blue_600, R.color.orange_600, R.color.teal_600, R.color.lime_600};

    private List<T> dataList;
    private List<T> dataListFilter;

    public BaseRecyclerAdapter(@NonNull Context context, List<T> list, @NonNull Class<T> itemClass) {
        this.context = context;
        this.tClass = itemClass;
        this.dataList = list;
        this.dataListFilter = list;
    }

    public final <view extends View> view bindView(View itemView, int id) {
        return itemView.findViewById(id);
    }

    @NonNull
    protected abstract ViewHolder<T> onCreateViewHolder(@NonNull LayoutInflater inflater, @NonNull ViewGroup parent, int viewType);

    @Override
    public final ViewHolder<T> onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        return onCreateViewHolder(LayoutInflater.from(context), parent, viewType);
    }


    protected abstract void onBindViewHolder(@NonNull Bundle bundle);

    @Override
    public final void onBindViewHolder(@NonNull ViewHolder<T> holder, int position, @NonNull List<Object> payloads) {
        if (payloads.isEmpty()) {
            super.onBindViewHolder(holder, position, payloads);
        } else {
            final Bundle bundle = (Bundle) payloads.get(0);
            if (bundle != null)
                onBindViewHolder(bundle);
        }
    }

    @Override
    public final void onBindViewHolder(@NonNull ViewHolder<T> holder, int position) {
        final T item = getItem(position);
        holder.bind(mItemClickCallback, item);
    }


    /**
     * get search filters from here
     */
    public abstract List<T> getSearchFilterList(List<T> originalDataList, String charString);

    @Override
    public Filter getFilter() {
        return new Filter() {
            @Override
            protected FilterResults performFiltering(CharSequence charSequence) {
                List<T> newDataList;
                if (TextUtils.isEmpty(charSequence)) {
                    newDataList = dataList;
                } else {
                    String charString = charSequence.toString().toLowerCase();
                    List<T> tmpList = getSearchFilterList(dataList, charString);
                    if (tmpList == null) {
                        tmpList = new ArrayList<>();
                    }
                    newDataList = tmpList;
                }

                FilterResults filterResults = new FilterResults();
                filterResults.count = newDataList.size();
                filterResults.values = newDataList;
                return filterResults;
            }

            @Override
            protected void publishResults(CharSequence constraint, FilterResults results) {
                dataListFilter = GlobalData.castList(results.values, tClass);
                notifyDataSetChanged();
                //updateDataList(GlobalData.castList(results.values, tClass));
            }
        };
    }

    public final Context getContext() {
        return context;
    }

    public final List<T> getDataList() {
        return dataListFilter;
    }

    public final T getItem(int position) {
        return dataListFilter.get(position);
    }

    @Override
    public final int getItemCount() {
        return dataListFilter == null ? 0 : dataListFilter.size();
    }

    @Override
    public void onAttachedToRecyclerView(RecyclerView recyclerView) {
        recyclerView.addOnScrollListener(new RecyclerView.OnScrollListener() {
            @Override
            public void onScrollStateChanged(@NonNull RecyclerView recyclerView, int newState) {
                onAttach = false;
                super.onScrollStateChanged(recyclerView, newState);
            }
        });
        super.onAttachedToRecyclerView(recyclerView);
    }

    private int lastPosition = -1;
    private boolean onAttach = true;

    public final void setAnimation(View view, int position, int animationType) {
        if (position > lastPosition) {
            ItemAnimation.animate(view, onAttach ? position : -1, animationType);
            lastPosition = position;
        }
    }

    public final void setRandomColor(View view, int position) {
        int color = ContextCompat.getColor(context, position >= 12 ? colors[position - 12] : colors[position]);
        if (view instanceof CardView) {
            ((CardView) view).setCardBackgroundColor(color);
        } else {
            view.setBackgroundColor(color);
        }
    }

    public abstract static class ViewHolder<T> extends RecyclerView.ViewHolder {

        private T mCurrentItem;

        public ViewHolder(@NonNull View itemView) {
            super(itemView);
        }

        public final void bind(ItemClickListener<T> itemClickCallback, T item) {
            mCurrentItem = item;
            performBind(itemClickCallback, item);
        }

        protected abstract void performBind(ItemClickListener<T> itemClickCallback, @NonNull T item);

        public final T getCurrentItem() {
            return mCurrentItem;
        }

    }

    /**
     * callbacks for Item Click events
     */
    private ItemClickListener<T> mItemClickCallback;

    public void setItemCallback(ItemClickListener<T> itemClickCallback) {
        this.mItemClickCallback = itemClickCallback;
    }

}