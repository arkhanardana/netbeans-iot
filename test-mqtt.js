const mqtt = require("mqtt");

const client = mqtt.connect(
  "mqtts://be975683929a42428ec88681c0295a02.s1.eu.hivemq.cloud:8883",
  {
    username: process.env.MQTT_USERNAME,
    password: process.env.MQTT_PASSWORD,

    clientId: "test-node-client",

    protocol: "mqtts",

    connectTimeout: 10000,
  }
);

client.on("connect", () => {
  console.log("================================");
  console.log("MQTT CONNECT BERHASIL!");
  console.log("================================");

  client.subscribe(
    "iot/esp8266/data",
    (err) => {
      if (err) {
        console.error("Subscribe gagal:", err);
      } else {
        console.log(
          "Subscribe berhasil: iot/esp8266/data"
        );
      }
    }
  );
});

client.on("error", (error) => {
  console.error("================================");
  console.error("MQTT ERROR");
  console.error(error);
  console.error("================================");
});

client.on("message", (topic, message) => {
  console.log(
    "MESSAGE:",
    topic,
    message.toString()
  );
});