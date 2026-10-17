package com.anubhav.commonutility;

import android.content.ContentResolver;
import android.content.Context;
import android.content.res.Resources;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.drawable.Drawable;
import android.net.Uri;
import android.util.Base64;
import android.view.View;
import android.widget.ImageView;

import com.bumptech.glide.Glide;
import com.bumptech.glide.load.engine.DiskCacheStrategy;
import com.anubhav.scanqr.R;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.MalformedURLException;
import java.net.URL;

public class ImageLoading {
    private Context context;

    public ImageLoading(Context context) {
        this.context = context;
    }

    public static void loadImages(String imageUrlDefault, ImageView imgView, int defaultImg) {
        if (imageUrlDefault == null) imageUrlDefault = "";

        String imageUrl = imageUrlDefault.replaceAll("\\/", "/");
        if ((imageUrl).equals("")) {
            if (defaultImg == 0) {
                imgView.setVisibility(View.GONE);
            } else {
                imgView.setImageResource(defaultImg);
            }
        } else {
            Glide.with(imgView.getContext())
                    .load(imageUrl)
                    .thumbnail(0.5f)
                    .centerCrop()
                    .error(defaultImg)
                    .placeholder(R.drawable.loader)
                    .diskCacheStrategy(DiskCacheStrategy.ALL)
                    .dontAnimate()
                    .into(imgView);
        }
    }

    public static void loadImages(Uri imageUrlDefault, ImageView imgView, int defaultImg) {
        if (defaultImg == 0) {
            imgView.setVisibility(View.GONE);
        } else {
            Glide.with(imgView.getContext())
                    .load(imageUrlDefault)
                    .thumbnail(0.5f)
                    .centerCrop()
                    .error(defaultImg)
                    .placeholder(R.drawable.loader)
                    .diskCacheStrategy(DiskCacheStrategy.ALL)
                    .dontAnimate()
                    .into(imgView);
        }
    }

    public static void loadLocalImages(int drawable, ImageView imgView) {
        if (drawable == 0) {
            imgView.setVisibility(View.GONE);
        } else {
            Glide.with(imgView.getContext()).load(drawable).into(imgView);
        }
    }

    public static void setImageFromDatabase(byte[] imgByte, ImageView imgView) {
        Bitmap bitmap = BitmapFactory.decodeByteArray(imgByte, 0,
                imgByte.length);

        imgView.setImageBitmap(bitmap);
    }

    public static Drawable byteToDrawable(byte[] byteArray) {
        if (byteArray != null && byteArray.length > 0) {
            ByteArrayInputStream ins = new ByteArrayInputStream(byteArray);
            return Drawable.createFromStream(ins, null);
        } else {
            return null;
        }
    }

    public static byte[] getImageByteFromUrl(Resources res, String imgUrl)
            throws IOException {
        ByteArrayOutputStream bais = new ByteArrayOutputStream();
        InputStream is = null;
        URL url = null;
        try {

            url = new URL(imgUrl);
            is = url.openStream();
            byte[] byteChunk = new byte[4096]; // Or whatever size you want to
            // read in at a time.
            int n;

            while ((n = is.read(byteChunk)) > 0) {
                bais.write(byteChunk, 0, n);
            }
        } catch (IOException e) {
            System.err.printf("Failed while reading bytes from %s: %s",
                    url.toExternalForm(), e.getMessage());
            e.printStackTrace();
        } finally {
            if (is != null) {
                is.close();
            }
        }
        /*
         * byte[] byteReturn = bais.toByteArray(); Bitmap bitmap =
         * BitmapFactory.decodeByteArray(byteReturn, 0, byteReturn.length);
         * bitmap.compress(CompressFormat.JPEG, 20, bais);
         */
        return bais.toByteArray();
    }

    public static byte[] getImageByteFromDrawable(Resources res, int imgdrawable) {
        ByteArrayOutputStream stream = new ByteArrayOutputStream();
        Bitmap bitmap = BitmapFactory.decodeResource(res, imgdrawable);
        bitmap.compress(Bitmap.CompressFormat.PNG, 70, stream);
        byte[] byteArray = stream.toByteArray();
        return byteArray;
    }

    public static int countImageInFolder(File file, int number) {
        File[] dirs = file.listFiles();
        String name = "";
        if (dirs != null) { // Sanity check
            for (File dir : dirs) {
                if (dir.isFile()) { // Check file or directory
                    name = dir.getName().toLowerCase();
                    // Add or delete extensions as needed
                    if (name.endsWith(".jpg")) {
                        number++;
                    }
                } else
                    number = countImageInFolder(dir, number);
            }
        }
        return number;
    }

    public static void mDownloadAndSave(File file, String directory,
                                        String[] url, String[] imgName) {
        // Setting up file to write the image to.
        File f = file;
        // Open InputStream to download the image.
        InputStream is;
        try {
            for (int i = 0; i < url.length; i++) {
                is = new URL(url[i]).openStream();
                OutputStream os = new FileOutputStream(new File(f, directory
                        + imgName[i]));
                // Set up OutputStream to write data into image file.
                CopyStream(is, os);
            }
        } catch (MalformedURLException e) {
            e.printStackTrace();
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    public static void CopyStream(InputStream is, OutputStream os) {
        final int buffer_size = 1024;
        try {
            byte[] bytes = new byte[buffer_size];
            for (; ; ) {
                int count = is.read(bytes, 0, buffer_size);
                if (count == -1)
                    break;
                os.write(bytes, 0, count);
            }
        } catch (Exception ex) {

        }
    }

    public static void saveImageFromBitmap(File file, Bitmap bitmap) {
        if (file.exists()) file.delete();
        try {
            FileOutputStream out = new FileOutputStream(file);
            bitmap.compress(Bitmap.CompressFormat.JPEG, 90, out);
            out.flush();
            out.close();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public static void loadByteImages(Context context, String base64ImageString, ImageView imgView) {
        Glide.with(context)
//                .load(Base64.decode(base64ImageString, Base64.DEFAULT))
                .load(DecodeImageToByte(context, base64ImageString))
//                .placeholder(R.drawable.app_logo)
                .into(imgView);
    }

    public static Bitmap DecodeImageToByte(Context context, String imageString) {
        String imageUrl = imageString.replaceAll("\\/", "/");
        byte[] imageBytes = Base64.decode(imageString, Base64.DEFAULT);
        Bitmap decodedImage = BitmapFactory.decodeByteArray(imageBytes, 0, imageBytes.length);

        return decodedImage;
    }

    public static String EncodeImageToByte(Context context, Uri uri) {
        ContentResolver cr = context.getContentResolver();
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        Bitmap bitmap = null;
        try {
            bitmap = android.provider.MediaStore.Images.Media.getBitmap(cr, uri);
        } catch (Exception e) {
            new CustomToast(context).showToast("Failed to encode image");
        }
        bitmap.compress(Bitmap.CompressFormat.JPEG, 100, baos);
        byte[] imageBytes = baos.toByteArray();
        String imageString = Base64.encodeToString(imageBytes, Base64.DEFAULT);

        return imageString;
    }

}