"use client";

import { useEffect, useState } from "react";
import mqtt from "mqtt";

interface SensorData {
  suhu: number | null;
  gas: number;
  buzzer: boolean;
}

// Tentukan ambang batas (threshold) gas di sini jika diperlukan
const GAS_THRESHOLD = 400;

export default function Home() {
  const [sensorData, setSensorData] = useState<SensorData>({
    suhu: null,
    gas: 0,
    buzzer: false,
  });

  const [connected, setConnected] = useState(false);
  // State untuk menutup alert secara manual jika diinginkan pengguna
  const [dismissedAlert, setDismissedAlert] = useState(false);

  // Cek apakah bahaya terdeteksi (buzzer ON atau nilai gas melebihi threshold)
  const isDanger = sensorData.buzzer || sensorData.gas >= GAS_THRESHOLD;

  useEffect(() => {
    const client = mqtt.connect("ws://localhost:9001");

    client.on("connect", () => {
      console.log("MQTT Connected");
      setConnected(true);

      client.subscribe("iot/esp8266/data", (error) => {
        if (error) {
          console.error("Subscribe error:", error);
        }
      });
    });

    client.on("message", (topic, message) => {
      console.log("Topic:", topic);
      console.log("Data:", message.toString());

      try {
        const data = JSON.parse(message.toString());

        setSensorData({
          suhu: data.suhu,
          gas: data.gas,
          buzzer: data.buzzer,
        });

        // Reset status dismiss jika kondisi bahaya baru terdeteksi
        if (data.buzzer || data.gas >= GAS_THRESHOLD) {
          setDismissedAlert(false);
        }
      } catch (error) {
        console.error("Gagal membaca data MQTT:", error);
      }
    });

    client.on("error", (error) => {
      console.error("MQTT Error:", error);
      setConnected(false);
    });

    client.on("close", () => {
      setConnected(false);
    });

    return () => {
      client.end();
    };
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10 text-gray-900">
      <div className="mx-auto max-w-5xl">

        {/* ==================== ALERT DANGER BAR ==================== */}
        {isDanger && !dismissedAlert && (
          <div className="mb-6 flex items-center justify-between rounded-2xl bg-red-600 p-4 text-white shadow-lg animate-pulse">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <h3 className="font-bold text-lg leading-tight">
                  PERINGATAN: KEBOCORAN GAS TERDETEKSI!
                </h3>
                <p className="text-xs text-red-100 mt-0.5">
                  Nilai gas: <span className="font-bold underline">{sensorData.gas} ppm</span> | Status Buzzer: <span className="font-bold uppercase">{sensorData.buzzer ? "ON" : "OFF"}</span>
                </p>
              </div>
            </div>
            
            {/* Tombol Tutup Alert */}
            <button
              onClick={() => setDismissedAlert(true)}
              className="rounded-lg bg-red-700 px-3 py-1.5 text-xs font-semibold hover:bg-red-800 transition-colors"
            >
              Tutup
            </button>
          </div>
        )}
        {/* ========================================================== */}

        {/* Header */}
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              Netbeans Smart Home
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Monitoring smart home secara realtime
            </p>
          </div>

          {/* MQTT Status */}
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

        {/* Sensor Cards */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

          {/* Temperature */}
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

          {/* Gas */}
          <div className={`rounded-2xl bg-white p-6 shadow-sm border-2 ${
            sensorData.gas >= GAS_THRESHOLD ? "border-red-500 bg-red-50/20" : "border-transparent"
          }`}>
            <div className="mb-5 flex items-center justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-xl">
                💨
              </div>
              <span className="text-xs font-medium uppercase tracking-wide text-gray-400">
                Sensor
              </span>
            </div>
            <p className="text-sm text-gray-500">Gas</p>
            <div className="mt-2 flex items-end gap-2">
              <span className={`text-4xl font-bold ${sensorData.gas >= GAS_THRESHOLD ? "text-red-600" : ""}`}>
                {sensorData.gas}
              </span>
              <span className="mb-1 text-gray-500">ppm</span>
            </div>
            <p className="mt-3 text-xs text-gray-400">
              Analog Value (Threshold: {GAS_THRESHOLD} ppm)
            </p>
          </div>

          {/* Buzzer */}
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-100 text-xl">
                🔔
              </div>
              <span className="text-xs font-medium uppercase tracking-wide text-gray-400">
                Output
              </span>
            </div>
            <p className="text-sm text-gray-500">Buzzer</p>
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

        {/* Status */}
        <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold">Status Sistem</h2>
              <p className="mt-1 text-sm text-gray-500">
                Data diperbarui secara realtime melalui MQTT
              </p>
            </div>

            <div
              className={`rounded-full px-4 py-2 text-sm font-medium ${
                isDanger
                  ? "bg-red-100 text-red-600 font-bold"
                  : "bg-green-100 text-green-600"
              }`}
            >
              {isDanger ? "⚠️ Gas Terdeteksi" : "✓ Sistem Normal"}
            </div>
          </div>
        </div>

        {/* MQTT Information */}
        <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6">
          <h2 className="font-semibold">MQTT Connection</h2>
          <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <span className="text-gray-400">Broker</span>
              <p className="font-medium">localhost:9001</p>
            </div>
            <div>
              <span className="text-gray-400">Topic</span>
              <p className="font-medium">iot/esp8266/data</p>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}