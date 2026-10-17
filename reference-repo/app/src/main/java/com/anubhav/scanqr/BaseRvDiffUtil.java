package com.anubhav.scanqr;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.DiffUtil;

public abstract class BaseRvDiffUtil<T> extends DiffUtil.ItemCallback<T> {

    public abstract boolean isContentsTheSame(T oldItem, T newItem);

    @Override
    public boolean areItemsTheSame(@NonNull T oldItem, @NonNull T newItem) {
        // User properties may have changed if reloaded from the DB, but ID is fixed
        return oldItem == newItem;
    }

    @Override
    public boolean areContentsTheSame(@NonNull T oldItem, @NonNull T newItem) {
        // NOTE: if you use equals, your object must properly override Object#equals()
        // Incorrectly returning false here will result in too many animations.
        return isContentsTheSame(oldItem, newItem);
    }

}