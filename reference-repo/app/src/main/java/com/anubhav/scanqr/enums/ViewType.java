package com.anubhav.scanqr.enums;

public enum ViewType {
    NULL(0),
    ITEM(1);

    private final int value;

    ViewType(final int newValue) {
        value = newValue;
    }

    public int getValue() {
        return value;
    }
}
