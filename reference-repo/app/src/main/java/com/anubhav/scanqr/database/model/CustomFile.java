package com.anubhav.scanqr.database.model;

import android.net.Uri;
import android.util.Log;

import java.io.File;

/**
 * The Class File used as model for custom file.
 *
 * @author Manoj
 */
public class CustomFile {

    private File file;
    private String path;
    private Uri uri;

    private String fileSize;

    /**
     * this constructor need to be implemented
     */
    public CustomFile(File file) {
        this(file, file.getAbsolutePath(), Uri.fromFile(file));
    }

    public CustomFile(String path, Uri uri) {
        this(new File(path), path, uri);
    }

    public CustomFile(File file, String path, Uri uri) {
        this.file = file;
        this.path = path;
        this.uri = uri;
    }

    public File getFile() {
        return file;
    }

    public void setFile(File file) {
        this.file = file;
    }

    public String getPath() {
        return path;
    }

    public void setPath(String path) {
        this.path = path;
    }

    public Uri getUri() {
        return uri;
    }

    public void setUri(Uri uri) {
        this.uri = uri;
    }

    public String getFileSize() {
        return fileSize;
    }

    public void setFileSize(String fileSize) {
        this.fileSize = fileSize;
    }

}