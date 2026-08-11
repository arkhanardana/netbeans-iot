#include <ESP8266WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>

#include <OneWire.h>
#include <DallasTemperature.h>
#include <Servo.h>
#include <DHT.h> // Library untuk DHT11

// =====================================================
// WIFI
// =====================================================

const char* WIFI_SSID = "fatur";
const char* WIFI_PASSWORD = "123454321";

// =====================================================
// HIVEMQ CLOUD
// =====================================================

const char* MQTT_SERVER =
  "be975683929a42428ec88681c0295a02.s1.eu.hivemq.cloud";

const int MQTT_PORT = 8883;

const char* MQTT_USERNAME =
  "netbeans-iot";

const char* MQTT_PASSWORD =
  "Netbeans_123";

// =====================================================
// MQTT TOPIC
// =====================================================

const char* MQTT_TOPIC =
  "iot/esp8266/data";

// =====================================================
// PIN
// =====================================================

// DHT11
#define DHT_PIN D1

// DS18B20
#define ONE_WIRE_BUS D2

// Sensor Gas
#define GAS_PIN A0

// Buzzer
#define BUZZER_PIN D5

// Raindrop
#define RAINDROP_PIN D6

// Servo
#define SERVO_PIN D7

// =====================================================
// BATAS GAS
// =====================================================

#define GAS_THRESHOLD 500

// =====================================================
// POSISI SERVO
// =====================================================

#define SERVO_OPEN 0
#define SERVO_CLOSE 90

// =====================================================
// SENSOR SETUP
// =====================================================

// DHT11
#define DHT_TYPE DHT11
DHT dht(DHT_PIN, DHT_TYPE);

// DS18B20
OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature sensors(&oneWire);

// =====================================================
// SERVO
// =====================================================

Servo jemuranServo;

// Status jemuran
bool jemuranTertutup = false;

// =====================================================
// MQTT
// =====================================================

WiFiClientSecure espClient;
PubSubClient mqttClient(espClient);

// =====================================================
// WIFI
// =====================================================

void setupWiFi() {

  Serial.println();
  Serial.println("Menghubungkan WiFi...");

  WiFi.begin(
    WIFI_SSID,
    WIFI_PASSWORD
  );

  while (WiFi.status() != WL_CONNECTED) {

    delay(500);

    Serial.print(".");
  }

  Serial.println();
  Serial.println("WiFi terhubung!");

  Serial.print("IP ESP8266 : ");
  Serial.println(WiFi.localIP());
}

// =====================================================
// MQTT
// =====================================================

void connectMQTT() {

  while (!mqttClient.connected()) {

    Serial.println();
    Serial.print("Menghubungkan MQTT...");

    String clientId =
      "ESP8266-" +
      String(ESP.getChipId());

    if (
      mqttClient.connect(
        clientId.c_str(),
        MQTT_USERNAME,
        MQTT_PASSWORD
      )
    ) {

      Serial.println(" BERHASIL!");

      Serial.print("MQTT Broker : ");
      Serial.println(MQTT_SERVER);

    } else {

      Serial.print(" GAGAL, rc=");
      Serial.println(mqttClient.state());

      Serial.println("Coba lagi 5 detik...");

      delay(5000);
    }
  }
}

// =====================================================
// SETUP
// =====================================================

void setup() {

  Serial.begin(115200);

  Serial.println();
  Serial.println("==============================");
  Serial.println(" SISTEM JEMURAN OTOMATIS");
  Serial.println("==============================");

  // ===================================================
  // DHT11
  // ===================================================
  
  dht.begin();
  Serial.println("DHT11 siap.");

  // ===================================================
  // DS18B20
  // ===================================================
  
  pinMode(ONE_WIRE_BUS, INPUT_PULLUP);
  sensors.begin();

  Serial.println("DS18B20 siap.");

  // ===================================================
  // SENSOR GAS
  // ===================================================

  pinMode(
    GAS_PIN,
    INPUT
  );

  Serial.println("Sensor gas siap.");

  // ===================================================
  // BUZZER
  // ===================================================

  pinMode(
    BUZZER_PIN,
    OUTPUT
  );

  digitalWrite(
    BUZZER_PIN,
    LOW
  );

  Serial.println("Buzzer siap.");

  // ===================================================
  // RAINDROP
  // ===================================================

  pinMode(
    RAINDROP_PIN,
    INPUT
  );

  Serial.println("Raindrop siap.");

  // ===================================================
  // SERVO
  // ===================================================

  jemuranServo.attach(
    SERVO_PIN
  );

  // Posisi awal jemuran terbuka
  jemuranServo.write(
    SERVO_OPEN
  );

  jemuranTertutup = false;

  Serial.println("Servo siap.");
  Serial.println("Jemuran: TERBUKA");

  // ===================================================
  // WIFI
  // ===================================================

  setupWiFi();  

  // ===================================================
  // TLS
  // ===================================================

  // Untuk testing.
  // Sertifikat HiveMQ tidak divalidasi.
  espClient.setInsecure();

  // ===================================================
  // MQTT
  // ===================================================

  mqttClient.setServer(
    MQTT_SERVER,
    MQTT_PORT
  );

  Serial.println();
  Serial.println("Semua sensor siap.");

  delay(2000);
}

// =====================================================
// LOOP
// =====================================================

void loop() {

  // ===================================================
  // PASTIKAN MQTT TERSAMBUNG
  // ===================================================

  if (!mqttClient.connected()) {

    connectMQTT();
  }

  mqttClient.loop();

  // ===================================================
  // BACA DHT11
  // ===================================================
  
  float kelembaban = dht.readHumidity();
  float suhuDHT = dht.readTemperature();

  // ===================================================
  // BACA SUHU DS18B20
  // ===================================================

  sensors.requestTemperatures();

  float suhuDS =
    sensors.getTempCByIndex(0);

  // ===================================================
  // BACA SENSOR GAS
  // ===================================================

  int gasValue =
    analogRead(GAS_PIN);

  // ===================================================
  // BACA RAINDROP
  // ===================================================

  int rainStatus =
    digitalRead(RAINDROP_PIN);

  // ===================================================
  // STATUS HUJAN
  // ===================================================

  bool hujan;

  // Kebanyakan modul raindrop:
  // LOW  = air/hujan terdeteksi
  // HIGH = tidak ada air

  if (rainStatus == LOW) {

    hujan = true;

  } else {

    hujan = false;
  }

  // ===================================================
  // KONTROL SERVO JEMURAN
  // ===================================================

  if (hujan) {

    // Hujan terdeteksi
     if (!jemuranTertutup) {

    Serial.println("HUJAN TERDETEKSI!");
    Serial.println("Jemuran ditutup...");

    jemuranServo.write(90);

    jemuranTertutup = true;
  }

  } else {

    // Tidak hujan
    if (jemuranTertutup) {

      Serial.println();
      Serial.println("Hujan berhenti.");
      Serial.println("Jemuran membuka...");

      jemuranServo.write(
        SERVO_OPEN
      );

      jemuranTertutup = false;
    }
  }

  // ===================================================
  // BUZZER
  // ===================================================

  bool buzzerStatus =
    gasValue >= GAS_THRESHOLD;

  if (buzzerStatus) {

    digitalWrite(
      BUZZER_PIN,
      HIGH
    );

  } else {

    digitalWrite(
      BUZZER_PIN,
      LOW
    );
  }

  // ===================================================
  // SERIAL MONITOR
  // ===================================================

  Serial.println();
  Serial.println("==============================");

  // DHT11
  Serial.print("Suhu DHT : ");
  if (isnan(suhuDHT)) {
    Serial.println("--");
  } else {
    Serial.print(suhuDHT);
    Serial.println(" °C");
  }

  Serial.print("Kelembaban : ");
  if (isnan(kelembaban)) {
    Serial.println("--");
  } else {
    Serial.print(kelembaban);
    Serial.println(" %");
  }

  // SUHU DS18B20

  Serial.print("Suhu Air : ");

  if (
    suhuDS == DEVICE_DISCONNECTED_C
  ) {

    Serial.println("--");

  } else {

    Serial.print(suhuDS);
    Serial.println(" °C");
  }

  // GAS

  Serial.print("Gas      : ");
  Serial.println(gasValue);

  // BUZZER

  Serial.print("Buzzer   : ");

  if (buzzerStatus) {

    Serial.println("ON");

  } else {

    Serial.println("OFF");
  }

  // HUJAN

  Serial.print("Hujan    : ");

  if (hujan) {

    Serial.println("TERDETEKSI");

  } else {

    Serial.println("TIDAK");
  }

  // SERVO

  Serial.print("Servo    : ");

  if (jemuranTertutup) {

    Serial.println("90° - TERTUTUP");

  } else {

    Serial.println("0° - TERBUKA");
  }

  Serial.println("==============================");

  // ===================================================
  // BUAT JSON
  // ===================================================

  String payload = "{";

  // SUHU DHT11
  payload += "\"suhu_udara\":";
  if (isnan(suhuDHT)) {
    payload += "null";
  } else {
    payload += String(suhuDHT, 2);
  }

  // KELEMBABAN DHT11
  payload += ",\"kelembaban\":";
  if (isnan(kelembaban)) {
    payload += "null";
  } else {
    payload += String(kelembaban, 2);
  }

  // SUHU DS18B20
  payload += ",\"suhu_air\":";
  if (
    suhuDS == DEVICE_DISCONNECTED_C
  ) {

    payload += "null";

  } else {

    payload += String(
      suhuDS,
      2
    );
  }

  // GAS
  payload += ",\"gas\":";
  payload += String(
    gasValue
  );

  // BUZZER
  payload += ",\"buzzer\":";
  payload += (
    buzzerStatus
    ? "true"
    : "false"
  );

  // HUJAN
  payload += ",\"hujan\":";
  payload += (
    hujan
    ? "true"
    : "false"
  );

  // SERVO
  payload += ",\"servo\":";
  payload += String(
    jemuranTertutup
    ? SERVO_CLOSE
    : SERVO_OPEN
  );

  payload += "}";

  // ===================================================
  // PUBLISH MQTT
  // ===================================================

  Serial.print("Publish: ");
  Serial.println(payload);

  bool success =
    mqttClient.publish(
      MQTT_TOPIC,
      payload.c_str()
    );

  if (success) {

    Serial.println(
      "MQTT Publish: BERHASIL"
    );

  } else {

    Serial.println(
      "MQTT Publish: GAGAL"
    );
  }

  Serial.println(
    "------------------------------"
  );

  // ===================================================
  // DELAY
  // ===================================================

  delay(2000);
}