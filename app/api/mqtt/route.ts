import mqtt from "mqtt";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const host = process.env.MQTT_HOST;
  const port = process.env.MQTT_PORT;
  const username = process.env.MQTT_USERNAME;
  const password = process.env.MQTT_PASSWORD;
  const topic = process.env.MQTT_TOPIC;

  console.log("========== MQTT CONFIG ==========");
  console.log("HOST:", host);
  console.log("PORT:", port);
  console.log("USERNAME:", username);
  console.log(
    "PASSWORD LENGTH:",
    password?.length
  );
  console.log("TOPIC:", topic);
  console.log("=================================");

  if (
    !host ||
    !port ||
    !username ||
    !password ||
    !topic
  ) {
    return new Response(
      "MQTT environment variables belum lengkap",
      {
        status: 500,
      }
    );
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const client = mqtt.connect(
        `mqtts://${host}:${port}`,
        {
          username,
          password,
          protocol: "mqtts",
          reconnectPeriod: 5000,
        }
      );

      const send = (data: unknown) => {
        try {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify(data)}\n\n`
            )
          );
        } catch {}
      };

      client.on("connect", () => {  
        console.log(
          "MQTT Server Connected"
        );

        send({
          type: "status",
          connected: true,
        });

        client.subscribe(
          topic,
          (error) => {
            if (error) {
              console.error(
                "Subscribe error:",
                error
              );

              send({
                type: "error",
                message:
                  "Gagal subscribe MQTT",
              });
            }
          }
        );
      });

      client.on(
        "message",
        (receivedTopic, message) => {
          try {
            const data =
              JSON.parse(
                message.toString()
              );

            send({
              type: "sensor",
              topic: receivedTopic,
              data,
            });
          } catch (error) {
            console.error(
              "JSON error:",
              error
            );
          }
        }
      );

      client.on("error", (error) => {
        console.error(
          "MQTT Error:",
          error
        );

        send({
          type: "error",
          message:
            "MQTT connection error",
        });
      });

      client.on("close", () => {
        send({
          type: "status",
          connected: false,
        });
      });

      const heartbeat =
        setInterval(() => {
          send({
            type: "heartbeat",
          });
        }, 15000);

      request.signal.addEventListener(
        "abort",
        () => {
          clearInterval(
            heartbeat
          );

          client.end(true);

          try {
            controller.close();
          } catch {}
        }
      );
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type":
        "text/event-stream",
      "Cache-Control":
        "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}