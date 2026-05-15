#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>

const char* ssid = "FAM: MENDEZ GUZMAN";
const char* password = "funda y machete";

//Configuración EMQX Cloud
const char* mqtt_server = "cf01cf3c.ala.us-east-1.emqxsl.com"; 
const int mqtt_port = 8883;
const char* mqtt_user = "safe_step"; 
const char* mqtt_pass = "jorge1234";

WiFiClientSecure espClient;
PubSubClient client(espClient);

void setup() {
  Serial.begin(115200);
  
  // Conexión WiFi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) { 
    delay(500); 
    Serial.print("."); 
  }
  Serial.println("\nWiFi Conectado");

  // Configuración de Seguridad para EMQX Cloud
  espClient.setInsecure(); 
  client.setServer(mqtt_server, mqtt_port);
}

void reconnect() {
  while (!client.connected()) {
    Serial.print("Intentando conexión MQTT segura...");
    
    if (client.connect("ESP32_Baston_Jorge", mqtt_user, mqtt_pass, "baston/estado", 1, true, "OFFLINE")) {
      Serial.println("¡CONECTADO CON ÉXITO!");
      // Publicamos que estamos ONLINE al conectar
      client.publish("baston/estado", "ONLINE", true);
    } else {
      Serial.print("Error, rc=");
      Serial.print(client.state());
      Serial.println(" Reintentando en 5 segundos...");
      delay(5000);
    }
  }
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();
}
