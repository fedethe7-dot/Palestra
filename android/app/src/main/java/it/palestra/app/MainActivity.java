package it.palestra.app;

import android.Manifest;
import android.app.Activity;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.ContentValues;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.print.PrintAttributes;
import android.print.PrintManager;
import android.provider.MediaStore;
import android.util.Base64;
import android.view.View;
import android.webkit.JavascriptInterface;
import android.webkit.PermissionRequest;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;

/* Palestra per Android: apre sempre l'app dal sito, così ogni aggiornamento arriva da solo.
   I dati restano nel telefono (memoria della WebView), come nel browser. */
public class MainActivity extends Activity {
    static final String URL_APP = "https://fedethe7-dot.github.io/Palestra/";
    static final String HOST = "fedethe7-dot.github.io";
    static final int RC_FILE = 1, RC_CAMERA = 2, RC_NOTIFICHE = 3;
    static final String CANALE = "timer";

    WebView web;
    ValueCallback<Uri[]> fileCallback;
    PermissionRequest richiestaCamera;

    @Override
    protected void onCreate(Bundle stato) {
        super.onCreate(stato);
        web = new WebView(this);
        web.setBackgroundColor(Color.parseColor("#060914"));
        setContentView(web);

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setCacheMode(WebSettings.LOAD_DEFAULT);
        s.setUserAgentString(s.getUserAgentString() + " PalestraApk/1.0");
        web.addJavascriptInterface(new Ponte(), "PalestraApk");

        web.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest r) {
                Uri u = r.getUrl();
                if (HOST.equals(u.getHost()) && u.getPath() != null && u.getPath().startsWith("/Palestra")) return false;
                try { startActivity(new Intent(Intent.ACTION_VIEW, u)); } catch (Exception e) { }
                return true;
            }
        });

        web.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(WebView v, ValueCallback<Uri[]> cb, FileChooserParams p) {
                if (fileCallback != null) fileCallback.onReceiveValue(null);
                fileCallback = cb;
                try {
                    Intent i = p.createIntent();
                    if (p.getMode() == FileChooserParams.MODE_OPEN_MULTIPLE) i.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true);
                    startActivityForResult(Intent.createChooser(i, "Scegli"), RC_FILE);
                } catch (Exception e) { fileCallback = null; return false; }
                return true;
            }

            @Override
            public void onPermissionRequest(PermissionRequest r) {
                runOnUiThread(() -> {
                    boolean video = false;
                    for (String x : r.getResources()) if (PermissionRequest.RESOURCE_VIDEO_CAPTURE.equals(x)) video = true;
                    if (!video) { r.deny(); return; }
                    if (checkSelfPermission(Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED) {
                        r.grant(new String[]{PermissionRequest.RESOURCE_VIDEO_CAPTURE});
                    } else {
                        richiestaCamera = r;
                        requestPermissions(new String[]{Manifest.permission.CAMERA}, RC_CAMERA);
                    }
                });
            }
        });

        if (stato != null) web.restoreState(stato);
        else web.loadUrl(URL_APP);
    }

    @Override protected void onSaveInstanceState(Bundle out) { super.onSaveInstanceState(out); web.saveState(out); }

    @Override
    public void onBackPressed() {
        if (web.canGoBack()) web.goBack(); else super.onBackPressed();
    }

    @Override protected void onResume() { super.onResume(); web.onResume(); }
    @Override protected void onPause() { web.onPause(); super.onPause(); }

    @Override
    protected void onActivityResult(int req, int res, Intent data) {
        super.onActivityResult(req, res, data);
        if (req != RC_FILE || fileCallback == null) return;
        Uri[] r = null;
        if (res == RESULT_OK && data != null) {
            if (data.getClipData() != null) {
                int n = data.getClipData().getItemCount();
                r = new Uri[n];
                for (int i = 0; i < n; i++) r[i] = data.getClipData().getItemAt(i).getUri();
            } else if (data.getData() != null) r = new Uri[]{data.getData()};
        }
        fileCallback.onReceiveValue(r);
        fileCallback = null;
    }

    @Override
    public void onRequestPermissionsResult(int req, String[] perm, int[] esiti) {
        super.onRequestPermissionsResult(req, perm, esiti);
        boolean ok = esiti.length > 0 && esiti[0] == PackageManager.PERMISSION_GRANTED;
        if (req == RC_CAMERA && richiestaCamera != null) {
            if (ok) richiestaCamera.grant(new String[]{PermissionRequest.RESOURCE_VIDEO_CAPTURE});
            else richiestaCamera.deny();
            richiestaCamera = null;
        }
    }

    void avviso(String t) { runOnUiThread(() -> Toast.makeText(this, t, Toast.LENGTH_LONG).show()); }

    /* Funzioni del telefono che la pagina può chiamare (window.PalestraApk) */
    class Ponte {
        @JavascriptInterface public String versione() { return "1.0"; }

        /* Salva un file (backup, CSV) nella cartella Download */
        @JavascriptInterface
        public boolean salvaFile(String nome, String tipo, String base64) {
            try {
                byte[] dati = Base64.decode(base64, Base64.DEFAULT);
                if (Build.VERSION.SDK_INT >= 29) {
                    ContentValues v = new ContentValues();
                    v.put(MediaStore.Downloads.DISPLAY_NAME, nome);
                    v.put(MediaStore.Downloads.MIME_TYPE, tipo == null || tipo.isEmpty() ? "application/octet-stream" : tipo);
                    Uri u = getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, v);
                    try (OutputStream o = getContentResolver().openOutputStream(u)) { o.write(dati); }
                } else {
                    File dir = getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS);
                    try (FileOutputStream o = new FileOutputStream(new File(dir, nome))) { o.write(dati); }
                }
                avviso("Salvato in Download: " + nome);
                return true;
            } catch (Exception e) {
                avviso("Non riesco a salvare il file: " + e.getMessage());
                return false;
            }
        }

        /* Stampa o salva in PDF la pagina com'è adesso */
        @JavascriptInterface
        public void stampa(String titolo) {
            runOnUiThread(() -> {
                PrintManager pm = (PrintManager) getSystemService(PRINT_SERVICE);
                String nome = titolo == null || titolo.isEmpty() ? "Palestra" : titolo;
                pm.print(nome, web.createPrintDocumentAdapter(nome), new PrintAttributes.Builder().build());
            });
        }

        @JavascriptInterface
        public boolean chiediNotifiche() {
            if (Build.VERSION.SDK_INT >= 33 && checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
                runOnUiThread(() -> requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS}, RC_NOTIFICHE));
                return false;
            }
            return true;
        }

        /* Notifica di fine recupero quando l'app è in secondo piano */
        @JavascriptInterface
        public void notifica(String titolo, String testo) {
            if (Build.VERSION.SDK_INT >= 33 && checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) return;
            NotificationManager nm = getSystemService(NotificationManager.class);
            if (nm.getNotificationChannel(CANALE) == null) {
                NotificationChannel c = new NotificationChannel(CANALE, "Timer di recupero", NotificationManager.IMPORTANCE_HIGH);
                c.enableVibration(true);
                c.setVibrationPattern(new long[]{0, 300, 150, 300});
                nm.createNotificationChannel(c);
            }
            Intent i = new Intent(MainActivity.this, MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP);
            PendingIntent pi = PendingIntent.getActivity(MainActivity.this, 0, i, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
            android.app.Notification n = new android.app.Notification.Builder(MainActivity.this, CANALE)
                    .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
                    .setContentTitle(titolo).setContentText(testo)
                    .setAutoCancel(true).setContentIntent(pi).build();
            nm.notify(1, n);
        }
    }
}
