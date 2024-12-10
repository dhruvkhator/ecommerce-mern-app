# E-Commerce Microservices Application

This is a fully-functional e-commerce application built using a microservices architecture. It includes features like product management, cart functionality, order processing, payment integration, and more.

## Features
- **Microservices Architecture**: Separate services for user, product, cart, order, inventory, payment, and review.
- **Kafka Integration**: Used for asynchronous communication between ORDER, INVENTORY AND PAYMENT services.
- **Redis**: Used for caching and job queue management.
- **PostgreSQL**: For relational data storage like payments table
- **MongoDB**: For flexible schema services.
- **Authentication**: JWT-based authentication.

## Tech Stack
- **Backend**: Node.js, Express, KafkaJS
- **Frontend**: React, Redux Toolkit
- **Databases**: PostgreSQL, MongoDB
- **Queue**: Redis with Bull
- **DevOps**: Docker (for local development)

## Prerequisites
- **Node.js**: v16+
- **Docker**: Installed and running
- **Kafka**: Local setup using Docker
- **PostgreSQL**: Local or hosted instance
- **Redis**: Local setup using Docker

## Local Development Setup
- **Kafka Setup**: Go to the kakfa_setup directory and run "docker-compose up -d"
- **Postgres Setup**: Go to the postgres-setup directory and run "docker-compose up -d"
- **Redis Setup** : Run "docker run -d --name redis-server -p 6379:6379 redis" in cmd
- **To start any Service**: Run "tsc --watch" first to compile your code and then run "npm run dev"


You will find the .env.example in all the services and client

