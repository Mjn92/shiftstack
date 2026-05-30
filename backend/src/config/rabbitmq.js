const amqp = require("amqplib");
require("dotenv").config();

let connection;
let channel;

const connectRabbitMQ = async () => {
  try {
    connection = await amqp.connect(process.env.RABBITMQ_URL);
    channel = await connection.createChannel();

    console.log("Connected to RabbitMQ");

    return channel;
  } catch (err) {
    console.error("RabbitMQ connection error:", err);
    process.exit(1);
  }
};

const getChannel = () => {
  if (!channel) {
    throw new Error("RabbitMQ channel not initialized");
  }

  return channel;
};

module.exports = {
  connectRabbitMQ,
  getChannel,
};
