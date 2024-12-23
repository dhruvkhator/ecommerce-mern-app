import { Kafka } from 'kafkajs';
import logger from '../utils/logger.js';
import dotenv from 'dotenv';

dotenv.config();

const kafka = new Kafka({
  clientId: 'local-service', // Adjust to your service name
  brokers: [process.env.KAFKA_BROKER || ""], // Local Kafka broker
});

const producer = kafka.producer();

export const connectProducer = async () => {
  try {
    await producer.connect();
    logger.info('Kafka producer connected successfully.');
  } catch (error) {
    logger.error(`Failed to connect Kafka producer: ${(error as Error).message}`);
  }
};

export const sendPaymentEvent = async (topic: string, message: any) => {
  try {
    logger.info(`Preparing to send message to topic: ${topic}`);
    await producer.send({
      topic,
      messages: [{ value: JSON.stringify(message) }],
    });
    logger.info(`Message sent to topic ${topic}: ${JSON.stringify(message)}`);
  } catch (error) {
    logger.error(`Failed to send message to topic ${topic}: ${(error as Error).message}`);
  }
};



