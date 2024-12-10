import { Kafka } from 'kafkajs';
import { handleOrderExpired } from './paymentKafkaController.js';
import logger from '../utils/logger.js';


const kafka = new Kafka({
  clientId: 'local-service',
  brokers: ['localhost:9092'],
});
// Create a Kafka Consumer
const consumer = kafka.consumer({ groupId: 'payment-group' });

// Function to connect the Kafka Consumer
export const connectConsumer = async () => {
    try {
      await consumer.connect();
      logger.info('Kafka consumer connected successfully.');
  
      // Subscribe to relevant topics
      await consumer.subscribe({ topic: 'order_expired', fromBeginning: false });
      logger.info('Subscribed to topic: order_expired');
  
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
              case 'order_expired':
                logger.info('Processing order_expired event.');
                await handleOrderExpired(eventData);
                logger.info('Successfully processed order_expired event.');
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