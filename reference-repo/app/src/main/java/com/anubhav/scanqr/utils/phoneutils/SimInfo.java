package com.anubhav.scanqr.utils.phoneutils;

import java.io.Serializable;

public class SimInfo implements Serializable {

    public String simOperator = "";
    public String simOperatorName = "";
    public String simCountryIso = "";
    public String simSerialNumber = "";
    public String simLine1Number = "";
    public String imei = "";

    public SimInfo() {
    }

}