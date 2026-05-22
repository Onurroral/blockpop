package com.onur.blockpop;

import android.os.Bundle;
import android.webkit.ValueCallback;
import android.webkit.WebView;
import android.widget.Toast;
import androidx.activity.OnBackPressedCallback;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.community.admob.AdMob;

public class MainActivity extends BridgeActivity {

    private long lastBackPressTime = 0;
    private static final long BACK_INTERVAL = 2000;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(AdMob.class);
        super.onCreate(savedInstanceState);

        // Geri tuşu dinleyicisi (Tüm Android sürümleriyle uyumlu)
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                final WebView webView = getBridge().getWebView();
                if (webView == null) return;

                webView.evaluateJavascript(
                        "(function(){" +
                                "  var ms=document.getElementById('menuScreen');" +
                                "  var gc=document.getElementById('game-container');" +
                                "  var homeTab=document.getElementById('tab-home');" +
                                "  var isGame=gc&&gc.style.visibility==='visible';" +
                                "  var isMenu=ms&&!ms.classList.contains('hidden');" +
                                "  var isHome=homeTab&&homeTab.classList.contains('tab-active');" +
                                "  if(isGame)return 'game';" +
                                "  if(isMenu&&isHome)return 'home';" +
                                "  if(isMenu)return 'othertab';" +
                                "  return 'other';" +
                                "})()",
                        new ValueCallback<String>() {
                            @Override
                            public void onReceiveValue(final String value) {
                                MainActivity.this.runOnUiThread(new Runnable() {
                                    @Override
                                    public void run() {
                                        String state = value.replace("\"", "").trim();
                                        if ("home".equals(state)) {
                                            long now = System.currentTimeMillis();
                                            if (now - lastBackPressTime < BACK_INTERVAL) {
                                                lastBackPressTime = 0;
                                                MainActivity.this.finish();
                                            } else {
                                                lastBackPressTime = now;
                                                Toast.makeText(MainActivity.this, "Çıkmak için tekrar basın", Toast.LENGTH_SHORT).show();
                                            }
                                        } else {
                                            lastBackPressTime = 0;
                                            webView.evaluateJavascript(
                                                    "if(typeof window.goToMainMenu==='function')window.goToMainMenu();", null);
                                        }
                                    }
                                });
                            }
                        }
                );
            }
        });
    }
}