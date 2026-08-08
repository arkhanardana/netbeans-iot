"use client";

import { useEffect, useState } from "react";

interface SensorData {
  suhu: number | null;
  gas: number;
  buzzer: boolean;
  hujan: boolean;
  servo: number;
}

const GAS_THRESHOLD = 400;

export default function Home() {
  const [sensorData, setSensorData] = useState<SensorData>({
    suhu: null,
    gas: 0,
    buzzer: false,
    hujan: false,
    servo: 0,
  });

  const [connected, setConnected] = useState(false);
  const [dismissedAlert, setDismissedAlert] = useState(false);

  const isDanger = sensorData.buzzer || sensorData.gas >= GAS_THRESHOLD;
  const isRaining = sensorData.hujan;

  useEffect(() => {
    const eventSource = new EventSource("/api/mqtt");

    eventSource.onopen = () => {
      console.log("SSE connection established");
    };

    eventSource.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log("MQTT Proxy:", message);

        // =========================
        // MQTT STATUS
        // =========================
        if (message.type === "status") {
          setConnected(message.connected);
        }

        // =========================
        // SENSOR DATA
        // =========================
        if (message.type === "sensor") {
          const data = message.data;

          const gasValue = Number(data.gas);
          const buzzerStatus = Boolean(data.buzzer);
          const hujanStatus = Boolean(data.hujan);
          const servoValue = Number(data.servo);

          setSensorData({
            suhu: data.suhu !== null ? Number(data.suhu) : null,
            gas: gasValue,
            buzzer: buzzerStatus,
            hujan: hujanStatus,
            servo: servoValue,
          });

          // =========================
          // RESET ALERT
          // =========================
          if (buzzerStatus || gasValue >= GAS_THRESHOLD) {
            setDismissedAlert(false);
          }
        }

        // =========================
        // MQTT ERROR
        // =========================
        if (message.type === "error") {
          console.error("MQTT Proxy Error:", message.message);
          setConnected(false);
        }
      } catch (error) {
        console.error("Gagal membaca data SSE:", error);
      }
    };

    eventSource.onerror = (error) => {
      console.error("SSE connection error:", error);
      setConnected(false);
    };

    return () => {
      eventSource.close();
    };
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10 text-gray-900">
      <div className="mx-auto max-w-5xl">
        
        {/* ==================== ALERT KEBOCORAN GAS (DANGER) ==================== */}
        {isDanger && !dismissedAlert && (
          <div className="mb-4 flex items-center justify-between rounded-2xl bg-red-600 p-4 text-white shadow-lg animate-pulse">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <h3 className="text-lg font-bold leading-tight">
                  PERINGATAN: KEBOCORAN GAS TERDETEKSI!
                </h3>
                <p className="mt-0.5 text-xs text-red-100">
                  Nilai gas:{" "}
                  <span className="font-bold underline">{sensorData.gas}</span>
                  {" | "}Status Buzzer:{" "}
                  <span className="font-bold uppercase">
                    {sensorData.buzzer ? "ON" : "OFF"}
                  </span>
                </p>
              </div>
            </div>
            <button
              onClick={() => setDismissedAlert(true)}
              className="rounded-lg bg-red-700 px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-red-800"
            >
              Tutup
            </button>
          </div>
        )}

        {/* ==================== ALERT HUJAN / JEMURAN ==================== */}
        {isRaining && (
          <div className="mb-6 flex items-center justify-between rounded-2xl bg-blue-600 p-4 text-white shadow-lg">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🌧️</span>
              <div>
                <h3 className="text-lg font-bold leading-tight">
                  INFO: HUJAN TERDETEKSI!
                </h3>
                <p className="mt-0.5 text-sm text-blue-100">
                  Jemuran otomatis <span className="font-bold underline">ditutup</span> untuk melindungi pakaian. (Posisi Servo: {sensorData.servo}°)
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ==================== HEADER ==================== */}
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Netbeans Smart Home</h1>
            <p className="mt-1 text-sm text-gray-500">
              Monitoring smart home & jemuran otomatis secara realtime
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-sm">
            <span
              className={`h-3 w-3 rounded-full ${
                connected ? "bg-green-500" : "bg-red-500"
              }`}
            />
            <span className="text-sm font-medium">
              {connected ? "MQTT Connected" : "MQTT Disconnected"}
            </span>
          </div>
        </div>

        {/* ==================== SENSOR CARDS ==================== */}
        {/* Mengubah lg:grid-cols-3 menjadi lg:grid-cols-4 agar 4 kotak tampil sejajar di layar besar */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          
          {/* ==================== TEMPERATURE ==================== */}
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-100 text-xl">
                🌡️
              </div>
              <span className="text-xs font-medium uppercase tracking-wide text-gray-400">
                Sensor
              </span>
            </div>
            <p className="text-sm text-gray-500">Suhu</p>
            <div className="mt-2 flex items-end gap-2">
              <span className="text-4xl font-bold">
                {sensorData.suhu !== null ? sensorData.suhu.toFixed(1) : "--"}
              </span>
              <span className="mb-1 text-gray-500">°C</span>
            </div>
            <p className="mt-3 text-xs text-gray-400">DS18B20</p>
          </div>

          {/* ==================== GAS ==================== */}
          <div
            className={`rounded-2xl bg-white p-6 shadow-sm border-2 ${
              sensorData.gas >= GAS_THRESHOLD
                ? "border-red-500 bg-red-50/20"
                : "border-transparent"
            }`}
          >
            <div className="mb-5 flex items-center justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-100 text-xl">
                💨
              </div>
              <span className="text-xs font-medium uppercase tracking-wide text-gray-400">
                Sensor
              </span>
            </div>
            <p className="text-sm text-gray-500">Gas</p>
            <div className="mt-2 flex items-end gap-2">
              <span
                className={`text-4xl font-bold ${
                  sensorData.gas >= GAS_THRESHOLD ? "text-red-600" : ""
                }`}
              >
                {sensorData.gas}
              </span>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  sensorData.gas >= GAS_THRESHOLD
                    ? "bg-red-500"
                    : "bg-green-500"
                }`}
              />
              <p
                className={`text-xs ${
                  sensorData.gas >= GAS_THRESHOLD
                    ? "text-red-500"
                    : "text-green-500"
                }`}
              >
                {sensorData.gas >= GAS_THRESHOLD ? "Bahaya" : "Aman"}
              </p>
            </div>
            <p className="mt-2 text-xs text-gray-400">
              Analog Value (Max: {GAS_THRESHOLD})
            </p>
          </div>

          {/* ==================== RAINDROP & SERVO (BARU) ==================== */}
          <div
            className={`rounded-2xl bg-white p-6 shadow-sm border-2 ${
              sensorData.hujan ? "border-blue-500 bg-blue-50/20" : "border-transparent"
            }`}
          >
            <div className="mb-5 flex items-center justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-xl">
                {sensorData.hujan ? "🌧️" : "☀️"}
              </div>
              <span className="text-xs font-medium uppercase tracking-wide text-gray-400">
                Cuaca
              </span>
            </div>
            <p className="text-sm text-gray-500">Status Jemuran</p>
            <div className="mt-2">
              <span
                className={`inline-flex rounded-full px-4 py-2 text-xl font-bold ${
                  sensorData.hujan
                    ? "bg-blue-100 text-blue-700"
                    : "bg-yellow-100 text-yellow-600"
                }`}
              >
                {sensorData.hujan ? "TERTUTUP" : "TERBUKA"}
              </span>
            </div>
            <p className="mt-3 text-xs text-gray-500 font-medium">
              {sensorData.hujan ? "Hujan Terdeteksi" : "Cerah / Tidak Hujan"}
            </p>
            <p className="mt-1 text-xs text-gray-400">
              Posisi Servo: {sensorData.servo}°
            </p>
          </div>

          {/* ==================== BUZZER ==================== */}
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-100 text-xl">
                🔔
              </div>
              <span className="text-xs font-medium uppercase tracking-wide text-gray-400">
                Output
              </span>
            </div>
            <p className="text-sm text-gray-500">Buzzer Gas</p>
            <div className="mt-2">
              <span
                className={`inline-flex rounded-full px-4 py-2 text-2xl font-bold ${
                  sensorData.buzzer
                    ? "bg-red-100 text-red-600 animate-bounce"
                    : "bg-green-100 text-green-600"
                }`}
              >
                {sensorData.buzzer ? "ON" : "OFF"}
              </span>
            </div>
            <p className="mt-3 text-xs text-gray-400">Status alarm gas</p>
          </div>

        </div>

        {/* ==================== STATUS KESELURUHAN ==================== */}
        <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold">Status Sistem</h2>
              <p className="mt-1 text-sm text-gray-500">
                Data diperbarui secara realtime melalui MQTT
              </p>
            </div>
            
            <div className="flex gap-2">
              {/* Badge Cuaca */}
              <div
                className={`rounded-full px-4 py-2 text-sm font-medium ${
                  sensorData.hujan
                    ? "bg-blue-100 text-blue-700"
                    : "bg-yellow-100 text-yellow-700"
                }`}
              >
                {sensorData.hujan ? "🌧️ Hujan" : "☀️ Cerah"}
              </div>

              {/* Badge Gas */}
              <div
                className={`rounded-full px-4 py-2 text-sm font-medium ${
                  isDanger
                    ? "bg-red-100 text-red-600"
                    : "bg-green-100 text-green-600"
                }`}
              >
                {isDanger ? "⚠️ Gas Terdeteksi" : "✓ Gas Normal"}
              </div>
            </div>
          </div>
        </div>

        {/* ==================== MQTT INFORMATION ==================== */}
        <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6">
          <h2 className="font-semibold">MQTT Connection</h2>
          <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <span className="text-gray-400">Broker</span>
              <p className="font-medium break-all">HiveMQ Cloud</p>
            </div>
            <div>
              <span className="text-gray-400">Topic</span>
              <p className="font-medium break-all">iot/esp8266/data</p>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}