#include <WiFi.h>
#include <AsyncTCP.h>
#include <ESPAsyncWebServer.h>
#include <Preferences.h>
#include "index.h"

#define LED_PIN 8

AsyncWebServer server(80);
Preferences preferences;

const char* AP_SSID = "safe_step";
const char* AP_PASS = "12345678";

bool ledState = false;

void abrirAP() {
  preferences.clear();
  WiFi.disconnect();
  WiFi.mode(WIFI_AP);
  WiFi.softAP(AP_SSID, AP_PASS);
  Serial.println("AP abierto. Entra a: 192.168.4.1");

  server.on("/", HTTP_GET, [](AsyncWebServerRequest* request) {
    request->send(200, "text/html", index_html);
  });

  server.on("/update", HTTP_GET, [](AsyncWebServerRequest* request) {
    if (request->hasParam("ssid")) {
      String ssid = request->getParam("ssid")->value();
      String pass = request->getParam("pass")->value();
      preferences.putString("ssid", ssid);
      preferences.putString("pass", pass);
      request->send(200, "text/plain", "OK");
      delay(500);
      ESP.restart();
    }
  });

  server.begin();
}

void setup() {
  Serial.begin(115200);
  pinMode(LED_PIN, OUTPUT);
  preferences.begin("wifi", false);

  String ssid = preferences.getString("ssid", "");
  String pass = preferences.getString("pass", "");

  if (ssid != "") {
    Serial.println("Conectando...");
    WiFi.mode(WIFI_STA);
    WiFi.begin(ssid.c_str(), pass.c_str());
    
    int intentos = 0;
    while (WiFi.status() != WL_CONNECTED && intentos < 20) {
      digitalWrite(LED_PIN, !digitalRead(LED_PIN));
      delay(300);
      intentos++;
    }
  }

  if (WiFi.status() == WL_CONNECTED) {
    digitalWrite(LED_PIN, LOW);
    Serial.println("Conectado! IP: " + WiFi.localIP().toString());
    Serial.println("Envia '1' para reconfigurar");
  } else {
    Serial.println("Sin conexion. Envia '1' para configurar");
  }
}

void loop() {
  // Leer serial
  if (Serial.available() > 0) {
    String msg = Serial.readStringUntil('\n');
    msg.trim();
    if (msg == "1") {
      Serial.println("Abriendo AP...");
      abrirAP();
    }
  }

  
  if (WiFi.status() != WL_CONNECTED && WiFi.getMode() == WIFI_STA) {
    digitalWrite(LED_PIN, LOW); delay(500);
    digitalWrite(LED_PIN, HIGH);  delay(500);
  } 
  else if (WiFi.getMode() == WIFI_AP) {
    digitalWrite(LED_PIN, LOW); delay(500);
    digitalWrite(LED_PIN, HIGH);  delay(500);
  }else {
    digitalWrite(LED_PIN, HIGH);
  }
}