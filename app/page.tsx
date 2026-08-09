"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  Warning,
  CloudRain,
  Thermometer,
  Wind,
  Sun,
  BellRinging,
  Bell,
  CheckCircle,
} from "@phosphor-icons/react";

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

        if (message.type === "status") {
          setConnected(message.connected);
        }

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

          if (buzzerStatus || gasValue >= GAS_THRESHOLD) {
            setDismissedAlert(false);
          }
        }

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
    <main className="min-h-screen bg-[#f8f9fa] px-6 py-10 text-black selection:bg-black selection:text-white">
      <div className="mx-auto max-w-5xl">
        {isDanger && !dismissedAlert && (
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center justify-between rounded-xl border-4 border-black bg-[#ff6b6b] p-5 text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center gap-4">
              <Warning size={40} weight="fill" className="animate-pulse" />
              <div>
                <h3 className="text-xl font-black uppercase tracking-tight">
                  Peringatan: Kebocoran Gas!
                </h3>
                <p className="mt-1 text-sm font-bold">
                  Nilai gas: <span className="underline">{sensorData.gas}</span> | Buzzer:{" "}
                  {sensorData.buzzer ? "ON" : "OFF"}
                </p>
              </div>
            </div>
            <button
              onClick={() => setDismissedAlert(true)}
              className="rounded-lg border-2 border-black bg-white px-6 py-2 font-bold transition-transform hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:shadow-none">
              Tutup
            </button>
          </div>
        )}

        {isRaining && (
          <div className="mb-8 flex items-center justify-between rounded-xl border-4 border-black bg-[#4dabf7] p-5 text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center gap-4">
              <CloudRain size={40} weight="fill" />
              <div>
                <h3 className="text-xl font-black uppercase tracking-tight">
                  Info: Hujan Terdeteksi
                </h3>
                <p className="mt-1 text-sm font-bold">
                  Jemuran otomatis ditutup (Posisi Servo: {sensorData.servo}°)
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="mb-10 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-5">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border-4 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] sm:h-20 sm:w-20">
              <Image
                src="/netbeans.png"
                alt="Netbeans Logo"
                width={80}
                height={80}
                className="h-full w-full object-cover"
                priority
              />
            </div>
            <div>
              <h1 className="text-4xl font-black uppercase tracking-tighter sm:text-5xl">
                Smart Home
              </h1>
              <p className="mt-1 text-base font-bold text-gray-700">Monitoring Realtime IOT</p>
            </div>
          </div>

          <div className="flex w-fit items-center gap-2 rounded-full border-2 border-black bg-white px-4 py-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <span
              className={`h-3 w-3 rounded-full border border-black ${connected ? "bg-[#51cf66]" : "bg-[#ff6b6b]"}`}
            />
            <span className="text-sm font-bold uppercase tracking-wider">
              {connected ? "MQTT Online" : "MQTT Offline"}
            </span>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col justify-between rounded-2xl border-4 border-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <div>
              <div className="mb-6 flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-black bg-gray-100">
                  <Thermometer size={24} weight="bold" />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest text-gray-500">
                  Suhu
                </span>
              </div>
              <div className="flex items-end gap-1">
                <span className="text-5xl font-black tracking-tighter">
                  {sensorData.suhu !== null ? sensorData.suhu.toFixed(1) : "--"}
                </span>
                <span className="mb-1 text-xl font-bold">°C</span>
              </div>
            </div>
            <p className="mt-4 text-xs font-bold text-gray-400">DS18B20</p>
          </div>

          <div
            className={`flex flex-col justify-between rounded-2xl border-4 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] ${
              sensorData.gas >= GAS_THRESHOLD ? "bg-[#ff6b6b]" : "bg-white"
            }`}>
            <div>
              <div className="mb-6 flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-black bg-white">
                  <Wind size={24} weight="bold" />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest opacity-70">Gas</span>
              </div>
              <div className="flex items-end gap-1">
                <span className="text-5xl font-black tracking-tighter">{sensorData.gas}</span>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider">
                {sensorData.gas >= GAS_THRESHOLD ? "BAHAYA" : "AMAN"}
              </span>
              <span className="text-xs font-bold opacity-60">Max: {GAS_THRESHOLD}</span>
            </div>
          </div>

          <div
            className={`flex flex-col justify-between rounded-2xl border-4 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] ${
              sensorData.hujan ? "bg-[#4dabf7]" : "bg-white"
            }`}>
            <div>
              <div className="mb-6 flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-black bg-white">
                  {sensorData.hujan ? (
                    <CloudRain size={24} weight="bold" />
                  ) : (
                    <Sun size={24} weight="bold" />
                  )}
                </div>
                <span className="text-xs font-bold uppercase tracking-widest opacity-70">
                  Cuaca
                </span>
              </div>
              <div>
                <span className="text-3xl font-black uppercase tracking-tighter">
                  {sensorData.hujan ? "Hujan" : "Cerah"}
                </span>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider">
                Servo: {sensorData.servo}°
              </span>
              <span className="text-xs font-bold opacity-60">
                {sensorData.hujan ? "TERTUTUP" : "TERBUKA"}
              </span>
            </div>
          </div>

          <div
            className={`flex flex-col justify-between rounded-2xl border-4 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] ${
              sensorData.buzzer ? "bg-[#ffc9c9]" : "bg-white"
            }`}>
            <div>
              <div className="mb-6 flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-black bg-white">
                  {sensorData.buzzer ? (
                    <BellRinging size={24} weight="bold" />
                  ) : (
                    <Bell size={24} weight="bold" />
                  )}
                </div>
                <span className="text-xs font-bold uppercase tracking-widest opacity-70">
                  Buzzer
                </span>
              </div>
              <div>
                <span className="text-5xl font-black tracking-tighter">
                  {sensorData.buzzer ? "ON" : "OFF"}
                </span>
              </div>
            </div>
            <p className="mt-4 text-xs font-bold opacity-60 uppercase tracking-wider">
              Alarm Status
            </p>
          </div>
        </div>

        <div className="mt-10 grid gap-6">
          <div className="flex flex-col justify-center rounded-2xl border-4 border-black bg-white p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <h2 className="text-xl font-black uppercase tracking-tight">Status Keseluruhan</h2>
            <div className="mt-4 flex flex-wrap gap-3">
              <div
                className={`flex items-center gap-2 rounded-full border-2 border-black px-4 py-2 text-sm font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${sensorData.hujan ? "bg-[#4dabf7]" : "bg-[#ffe066]"}`}>
                {sensorData.hujan ? (
                  <CloudRain size={16} weight="bold" />
                ) : (
                  <Sun size={16} weight="bold" />
                )}
                {sensorData.hujan ? "Hujan" : "Cerah"}
              </div>
              <div
                className={`flex items-center gap-2 rounded-full border-2 border-black px-4 py-2 text-sm font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${isDanger ? "bg-[#ff6b6b]" : "bg-[#51cf66]"}`}>
                {isDanger ? (
                  <Warning size={16} weight="bold" />
                ) : (
                  <CheckCircle size={16} weight="bold" />
                )}
                {isDanger ? "Gas Bahaya" : "Gas Normal"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
