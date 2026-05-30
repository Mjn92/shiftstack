const { getChannel } = require("../config/rabbitmq");

const sendToQueue = async (queueName, message) => {
  const channel = getChannel();

  await channel.assertQueue(queueName, {
    durable: true,
  });

  channel.sendToQueue(queueName, Buffer.from(JSON.stringify(message)), {
    persistent: true,
  });
};

module.exports = {
  sendToQueue,
};
