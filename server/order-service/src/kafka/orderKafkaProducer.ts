// Kafka Producer setup for Order-Service
import { Kafka } from 'kafkajs';
import logger from '../utils/logger.js';


const kafka = new Kafka({
  clientId: 'local-service',
  brokers: ['localhost:9092'],
});

// Create a Kafka Producer
const producer = kafka.producer();

// Function to connect the Kafka Producer
export const connectProducer = async () => {
  try {
    await producer.connect();
    logger.info('Kafka producer connected successfully.');
  } catch (error) {
    logger.error(`Failed to connect Kafka producer: ${(error as Error).message}`);
  }
};

// Function to send message to Kafka topic
export const sendMessage = async (topic: string, message: any) => {
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
