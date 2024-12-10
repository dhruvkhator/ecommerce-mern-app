import { Kafka } from 'kafkajs';
import { handleOrderPlaced, handleOrderShipped, handleOrderCanceled } from './inventoryKafkaController.js';
import logger from '../utils/logger.js';

const kafka = new Kafka({
    clientId: 'local-service',
    brokers: ['localhost:9092'],
});

// Create a Kafka Consumer
const consumer = kafka.consumer({ groupId: 'inventory-group' });

// Function to connect the Kafka Consumer
export const connectConsumer = async () => {
    try {
        await consumer.connect();
        logger.info('Kafka consumer connected successfully.');

        // Subscribe to relevant topics
        const topics = ['order_placed', 'order_shipped', 'order_canceled'];
        for (const topic of topics) {
            await consumer.subscribe({ topic, fromBeginning: false });
            logger.info(`Subscribed to topic: ${topic}`);
        }

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
                        case 'order_placed':
                            logger.info('Processing event: order_placed');
                            await handleOrderPlaced(eventData);
                            logger.info('Successfully processed event: order_placed');
                            break;

                        case 'order_shipped':
                            logger.info('Processing event: order_shipped');
                            await handleOrderShipped(eventData);
                            logger.info('Successfully processed event: order_shipped');
                            break;

                        case 'order_canceled':
                            logger.info('Processing event: order_canceled');
                            await handleOrderCanceled(eventData);
                            logger.info('Successfully processed event: order_canceled');
                            break;

                        default:
                            logger.error(`Received message on unknown topic: ${topic}`);
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
