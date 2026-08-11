import { NextResponse } from "next/server";
import mqtt from "mqtt";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { topic, message } = body;

    const client = mqtt.connect(`mqtts://${process.env.MQTT_HOST}:${process.env.MQTT_PORT}`, {
      username: process.env.MQTT_USERNAME,
      password: process.env.MQTT_PASSWORD,
      protocol: "mqtts",
      reconnectPeriod: 5000,
    });

    await new Promise<void>((resolve, reject) => {
      client.on("connect", () => {
        client.publish(topic, message, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
      client.on("error", (err) => reject(err));
    });

    client.end();

    return NextResponse.json({ success: true, message: "Perintah terkirim" });
  } catch (error) {
    console.error("MQTT Publish Error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal mengirim perintah MQTT" },
      { status: 500 },
    );
  }
}
