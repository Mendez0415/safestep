#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <Preferences.h>
#include <WebServer.h>
#include <DNSServer.h>
#include "index.h"
#include "confirm_html.h"

//Detección de caídas (Edge Impulse + MPU6050)
#include <Jorge_1504-project-1_inferencing.h>
#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>
#include <Wire.h>

#define MAX_ACCEPTED_RANGE 4.0f
#define FREQUENCY_HZ 100
#define INTERVAL_MS (1000 / (FREQUENCY_HZ + 1))

Adafruit_MPU6050 mpu;

// Pines del led
#define LED_PIN  8

// datos del MQTT 
const char* mqtt_server = "qd011661.ala.eu-central-1.emqxsl.com";
const int   mqtt_port   = 8883;
const char* mqtt_user   = "safe_step";
const char* mqtt_pass   = "jorge1234";

// Portal cautivo 
const char* AP_SSID  = "SafeStep";
const byte  DNS_PORT = 53;
DNSServer   dnsServer;
WebServer   webServer(80);

// Variables globales para guardar credenciales
Preferences      preferences;
WiFiClientSecure espClient;
PubSubClient     mqttClient(espClient);

String savedSSID     = "";
String savedPassword = "";
bool   wifiConnected = false;
bool   apActive      = false;
bool   resetDesdeApp = false; // true = viene de RESET por MQTT

unsigned long lastWifiCheck = 0;
unsigned long lastLedBlink  = 0;
unsigned long lastMqttCheck = 0;
bool          ledState      = false;
bool          wifiWasLost   = false;

//Borrar credenciales
void borrarCredenciales() {
  preferences.begin("wifi", false);
  preferences.clear();
  preferences.end();
  savedSSID     = "";
  savedPassword = "";
}

//Handlers del servidor web
void handleRoot() {
  if (resetDesdeApp) {
    webServer.send(200, "text/html", index_html);
  } else {
    webServer.send(200, "text/html", confirm_html);
  }
}

void handleReconfig() {
  borrarCredenciales();
  webServer.send(200, "text/html", index_html);
}

void handleUpdate() {
  if (webServer.hasArg("ssid")) {
    savedSSID     = webServer.arg("ssid");
    savedPassword = webServer.hasArg("pass") ? webServer.arg("pass") : "";

    preferences.begin("wifi", false);
    preferences.putString("ssid", savedSSID);
    preferences.putString("pass", savedPassword);
    preferences.end();

    webServer.send(200, "text/plain", "OK");
    Serial.println("Credenciales guardadas: " + savedSSID);

    delay(1000);
    desactivarAP();
    conectarWiFi();
  } else {
    webServer.send(400, "text/plain", "Faltan datos");
  }
}

void handleNotFound() {
  webServer.sendHeader("Location", "http://192.168.4.1", true);
  webServer.send(302, "text/plain", "");
}

//Activar Access Point
void desactivarAP() {
  webServer.stop();
  dnsServer.stop();
  WiFi.softAPdisconnect(true);
  WiFi.mode(WIFI_STA);
  apActive      = false;
  resetDesdeApp = false;
}

void activarAP(bool desdeApp) {
  resetDesdeApp = desdeApp;

  if (desdeApp) {
    borrarCredenciales();
  }

  Serial.println(desdeApp ? "AP activado desde app." : "AP activado por pérdida de WiFi.");

  WiFi.disconnect(true);
  delay(500);
  WiFi.mode(WIFI_AP);
  WiFi.softAP(AP_SSID);

  dnsServer.start(DNS_PORT, "*", WiFi.softAPIP());

  webServer.on("/", handleRoot);
  webServer.on("/reconfig", handleReconfig);
  webServer.on("/update", handleUpdate);
  webServer.onNotFound(handleNotFound);
  webServer.begin();

  apActive      = true;
  wifiConnected = false;
  Serial.println("AP activo: " + String(AP_SSID) + " | IP: " + WiFi.softAPIP().toString());
}

// Conectar WiFi
void conectarWiFi() {
  if (savedSSID == "") {
    activarAP(false);
    return;
  }

  Serial.println("Conectando a: " + savedSSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(savedSSID.c_str(), savedPassword.c_str());

  int intentos = 0;
  while (WiFi.status() != WL_CONNECTED && intentos < 20) {
    delay(500);
    Serial.print(".");
    intentos++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi conectado. IP: " + WiFi.localIP().toString());
    wifiConnected = true;
    wifiWasLost   = false;
    conectarMQTT();
  } else {
    Serial.println("\nNo pudo conectar. Activando AP...");
    activarAP(false);
  }
}

// MQTT callback
void mqttCallback(char* topic, byte* payload, unsigned int length) {
  String msg = "";
  for (int i = 0; i < length; i++) msg += (char)payload[i];
  Serial.println("MQTT [" + String(topic) + "]: " + msg);

  if (String(topic) == "baston/config" && msg == "RESET") {
    Serial.println("RESET desde app. Activando AP con borrado de credenciales...");
    mqttClient.disconnect();
    delay(500);
    activarAP(true);
  }
}

// Conectar MQTT 
void conectarMQTT() {
  espClient.setInsecure();
  mqttClient.setServer(mqtt_server, mqtt_port);
  mqttClient.setCallback(mqttCallback);
  mqttClient.setKeepAlive(5);

  Serial.print("Conectando MQTT...");
  if (mqttClient.connect("ESP32_SafeStep", mqtt_user, mqtt_pass,
                          "baston/estado", 1, true, "OFFLINE")) {
    Serial.println("¡Conectado!");
    mqttClient.publish("baston/estado", "ONLINE", true);
    mqttClient.subscribe("baston/config");
  } else {
    Serial.print("Error rc=");
    Serial.println(mqttClient.state());
  }
}

void cargarWiFiGuardado() {
  preferences.begin("wifi", true);
  savedSSID     = preferences.getString("ssid", "");
  savedPassword = preferences.getString("pass", "");
  preferences.end();
}

//Detección de caídas 
float ei_get_sign(float number) {
  return (number >= 0.0) ? 1.0 : -1.0;
}

void iniciarSensorCaidas() {
  if (!mpu.begin()) {
    Serial.println("Failed to initialize IMU!");
  } else {
    Serial.println("IMU initialized");
  }
  
  mpu.setAccelerometerRange(MPU6050_RANGE_4_G);
  mpu.setGyroRange(MPU6050_RANGE_500_DEG);
  mpu.setFilterBandwidth(MPU6050_BAND_94_HZ);

  if (EI_CLASSIFIER_RAW_SAMPLES_PER_FRAME != 3) {
    Serial.println("ERR: EI_CLASSIFIER_RAW_SAMPLES_PER_FRAME should be equal to 3 (the 3 sensor axes)");
  }
}

unsigned long lastFallAlert = 0;
const unsigned long FALL_COOLDOWN_MS = 15000;
// Corre una inferencia; si detecta caída, publica por MQTT en
// "baston/caida".
void correrDeteccionCaidas() {
  float buffer[EI_CLASSIFIER_DSP_INPUT_FRAME_SIZE] = { 0 };

  for (size_t ix = 0; ix < EI_CLASSIFIER_DSP_INPUT_FRAME_SIZE; ix += 3) {
    uint64_t next_tick = micros() + (EI_CLASSIFIER_INTERVAL_MS * 1000);

    sensors_event_t a, g, temp;
    mpu.getEvent(&a, &g, &temp);

    buffer[ix]     = a.acceleration.x;
    buffer[ix + 1] = a.acceleration.y;
    buffer[ix + 2] = a.acceleration.z;

    delayMicroseconds(next_tick - micros());
  }

  signal_t signal;
  int err = numpy::signal_from_buffer(buffer, EI_CLASSIFIER_DSP_INPUT_FRAME_SIZE, &signal);
  if (err != 0) {
    Serial.printf("Failed to create signal from buffer (%d)\n", err);
    return;
  }

  ei_impulse_result_t result = { 0 };
  err = run_classifier(&signal, &result, false);
  if (err != EI_IMPULSE_OK) {
    Serial.printf("ERR: Failed to run classifier (%d)\n", err);
    return;
  }

  // Busca la clase con mayor confianza entre TODAS las disponibles
  // (actividad, caida, caminando, reposo) en vez de asumir índices fijos.
  int bestIndex = 0;
  float bestValue = result.classification[0].value;

  for (size_t ix = 1; ix < EI_CLASSIFIER_LABEL_COUNT; ix++) {
    if (result.classification[ix].value > bestValue) {
      bestValue = result.classification[ix].value;
      bestIndex = ix;
    }
  }

  const char* bestLabel = result.classification[bestIndex].label;

  if (bestValue >= 0.7 && strcmp(bestLabel, "caida") == 0) {
    if (millis() - lastFallAlert > FALL_COOLDOWN_MS) {
      lastFallAlert = millis();

      Serial.println("¡CAÍDA DETECTADA! Confianza: " + String(bestValue));
      digitalWrite(LED_PIN, LOW);
      delay(200);

      if (mqttClient.connected()) {
        mqttClient.publish("baston/caida", "CAIDA_DETECTADA");
      } else {
        Serial.println("MQTT no conectado, no se pudo publicar la caída");
      }
    }
  } else {
    digitalWrite(LED_PIN, HIGH);
  }
}

void setup() {
  Serial.begin(115200);
  pinMode(LED_PIN, OUTPUT);

  Wire.begin(0,1);

  iniciarSensorCaidas();

  cargarWiFiGuardado();

  if (savedSSID != "") {
    conectarWiFi();
  } else {
    activarAP(false);
  }
}

void loop() {

  if (apActive) {
    dnsServer.processNextRequest();
    webServer.handleClient();

    if (millis() - lastLedBlink > 300) {
      lastLedBlink = millis();
      ledState = !ledState;
      digitalWrite(LED_PIN, LOW);
    }
    return;
  }

  // Verificar WiFi cada 5 segundos
  if (millis() - lastWifiCheck > 5000) {
    lastWifiCheck = millis();

    if (WiFi.status() != WL_CONNECTED) {
      if (!wifiWasLost) {
        wifiWasLost   = true;
        wifiConnected = false;
        Serial.println("WiFi perdido. Intentando reconectar...");
      }
      WiFi.reconnect();
    } else {
      if (wifiWasLost) {
        wifiWasLost   = false;
        wifiConnected = true;
        Serial.println("WiFi reconectado.");
        conectarMQTT();
      }
    }
  }

  // Mantener MQTT
  if (wifiConnected) {
    if (!mqttClient.connected()) {
      if (millis() - lastMqttCheck > 5000) {
        lastMqttCheck = millis();
        conectarMQTT();
      }
    } else {
      mqttClient.loop();
    }
  }

  // LED de estado 
  if ((wifiConnected && mqttClient.connected())) {
    digitalWrite(LED_PIN, HIGH);
  }


  correrDeteccionCaidas();
}
