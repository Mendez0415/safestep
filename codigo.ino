// #include <esp_now.h>
#include <WiFi.h>
#include <ArduinoOTA.h>
#include <Jorge_1504-project-1_inferencing.h>
// #include <bast_n_inferencing.h>
#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>
#include <Wire.h>
#include <HTTPClient.h>


#define MAX_ACCEPTED_RANGE 4.0f

#define FREQUENCY_HZ 100
#define INTERVAL_MS (1000 / (FREQUENCY_HZ + 1))

// Constant for led control
const uint8_t LED_PIN = 8;

// Constants for WiFi connection
const char* ssid = "Tesalia";
const char* password = "Tesalia2025@";

// Constants for telegram bot communication
const String token = "8359027548:AAGx7Zui7lM_4sDnaiO2_EfQTXBO3uR7_2U";
const String chat_id = "8321887291";

// static unsigned long last_interval_ms = 0;

// Create object for mpu
Adafruit_MPU6050 mpu;

void setup() {
  pinMode(LED_PIN, OUTPUT);

  // Init Serial Monitor
  Serial.begin(115200);
  delay(100);

  if (!mpu.begin()) {
    ei_printf("Failed to initialize IMU!\r\n");
  } else {
    ei_printf("IMU initialized\r\n");
  }

  mpu.setAccelerometerRange(MPU6050_RANGE_4_G);
  mpu.setGyroRange(MPU6050_RANGE_500_DEG);
  mpu.setFilterBandwidth(MPU6050_BAND_94_HZ);

  if (EI_CLASSIFIER_RAW_SAMPLES_PER_FRAME != 3) {
    ei_printf("ERR: EI_CLASSIFIER_RAW_SAMPLES_PER_FRAME should be equal to 3 (the 3 sensor axes)\n");
    return;
  }

  // Set device as a Wi-Fi Station
  WiFi.begin(ssid, password);
  Serial.print("Conectando a WiFi");
  //Asta que el estatus del wifi no sea WL_CONNECTED NO PASA A LO OTRO
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    Serial.flush();
    digitalWrite(LED_PIN, HIGH);
    delay(500);
    digitalWrite(LED_PIN, LOW);
    delay(500);
  }

  Serial.println("\nConectado con éxito.");
  
  digitalWrite(LED_PIN, LOW);
  Serial.println("\nConectado. IP: " + WiFi.localIP().toString());
  ArduinoOTA.setHostname("SAFE-STEP");
  ArduinoOTA.setPassword("123456");
  ArduinoOTA.begin();
}

float ei_get_sign(float number) {
  return (number >= 0.0) ? 1.0 : -1.0;
}

void sendTelegramMessage() {
  //Mientras el estatus sea igualado procedera
  if (WiFi.status() == WL_CONNECTED) {
    //Creamos un objeto para que sea nuestro navegador web invisible
    HTTPClient http;

    //Construimos la URL para el mensaje
    String mensaje = "¡Ha ocurrido un problema!";
    String url = "https://api.telegram.org/bot" + token + "/sendMessage?chat_id=" + chat_id + "&text=" + mensaje;

    Serial.println("Sending message");

    http.begin(url);            //El Esp32 se prepara para visitar la direccion
    int httpCode = http.GET();  //Petición a la API o Realiza la conexion

    //si la respuesta del http.GET ES 200 PROCEDE TODO
    if (httpCode == 200) {
      Serial.printf("API: %d\n", httpCode);
    } else {
      Serial.printf("Request error: %s\n", http.errorToString(httpCode).c_str());
    }

    http.end();  // Cerramos la conexión
    Serial.println("Message send");
  }
}


void loop() {
  ArduinoOTA.handle();

  ei_printf("\nComenzando inferencia en 500 milisegundos...\n");

  delay(300);

  ei_printf("Sampleando...\n");

  float buffer[EI_CLASSIFIER_DSP_INPUT_FRAME_SIZE] = { 0 };

  for (size_t ix = 0; ix < EI_CLASSIFIER_DSP_INPUT_FRAME_SIZE; ix += 3) {

    uint64_t next_tick = micros() + (EI_CLASSIFIER_INTERVAL_MS * 1000);

    sensors_event_t a, g, temp;
    mpu.getEvent(&a, &g, &temp);

    buffer[ix] = a.acceleration.x;
    buffer[ix + 1] = a.acceleration.y;
    buffer[ix + 2] = a.acceleration.z;

    delayMicroseconds(next_tick - micros());
  }
  signal_t signal;
  int err = numpy::signal_from_buffer(buffer, EI_CLASSIFIER_DSP_INPUT_FRAME_SIZE, &signal);

  if (err != 0) {
    ei_printf("Failed to create signal from buffer (%d)\n", err);
    return;
  }

  ei_impulse_result_t result = { 0 };
  err = run_classifier(&signal, &result, false);
  if (err != EI_IMPULSE_OK) {
    ei_printf("ERR: Failed to run classifier (%d)\n", err);
    return;
  }

  // print the predictions
  ei_printf("Predictions ");
  ei_printf("(DSP: %d ms., Classification: %d ms., Anomaly: %d ms.)",
            result.timing.dsp, result.timing.classification, result.timing.anomaly);
  ei_printf(": \n");
  for (size_t ix = 0; ix < EI_CLASSIFIER_LABEL_COUNT; ix++) {
    ei_printf("    %s: %.5f\n", result.classification[ix].label, result.classification[ix].value);
  }

  if (result.classification[0].value >= 0.7) {
    sendTelegramMessage();
    digitalWrite(LED_PIN, HIGH);
  }
  if (result.classification[1].value >= 0.7) {
    digitalWrite(LED_PIN, LOW);
  }
}