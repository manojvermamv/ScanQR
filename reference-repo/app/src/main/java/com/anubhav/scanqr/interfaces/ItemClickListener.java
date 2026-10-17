package com.anubhav.scanqr.interfaces;

import java.util.List;

public interface ItemClickListener<T> {
    void onItemClick(int position, T item);

    void onItemLongClick(int position, T item);

    void onItemSelected(int position, T item);

    void onItemsSelected(List<T> selectedItems);

    void onItemSelectionChanged(int position, T item);
}