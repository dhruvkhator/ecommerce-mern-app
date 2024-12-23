import { Kafka } from 'kafkajs';
import { handlePaymentCompleted, handlePaymentFailed } from './orderKafkaController.js';
import logger from '../utils/logger.js';
import dotenv from 'dotenv';

dotenv.config();

const kafka = new Kafka({
  clientId: 'local-service', // Adjust to your service name
  brokers: [process.env.KAFKA_BROKER || ""], // Local Kafka broker
});

// Create a Kafka Consumer
const consumer = kafka.consumer({ groupId: 'order-group' });

// Function to connect the Kafka Consumer
export const connectConsumer = async () => {
    try {
        await consumer.connect();
        logger.info('Kafka consumer connected successfully.');

        // Subscribe to relevant topics
        await consumer.subscribe({ topic: 'payment_completed', fromBeginning: false });
        logger.info('Subscribed to topic: payment_completed');

        await consumer.subscribe({ topic: 'payment_failed', fromBeginning: false });
        logger.info('Subscribed to topic: payment_failed');

        // Handle incoming messages
        await consumer.run({
            eachMessage: async ({ topic, partition, message }) => {
                if (!message.value) {
                    logger.warn(`Received null or empty message on topic: ${topic}, partition: ${partition}`);
                    return;
                }
     

                const eventData = JSON.parse(message.value.toString());
                logger.info(`Received message on topic: ${topic}, partition: ${partition}, data: ${JSON.stringify(eventData)}`);
                try {
                    switch (topic) {
                        case 'payment_completed':
                            logger.info('Processing payment completed event.');
                            await handlePaymentCompleted(eventData);
                            logger.info('Successfully processed payment completed event.');
                            break;

                        case 'payment_failed':
                            logger.info('Processing payment failed event.');
                            await handlePaymentFailed(eventData);
                            logger.info('Successfully processed payment failed event.');
                            break;

                        default:
                            logger.error(`Unknown topic: ${topic}`);
                    }
                } catch (processingError) {
                    logger.error(`Error processing message on topic ${topic}: ${(processingError as Error).message}`);
                }
            },
        });
    } catch (error) {
        logger.error(`Failed to connect Kafka consumer: ${(error as Error).message}`);
    }
};