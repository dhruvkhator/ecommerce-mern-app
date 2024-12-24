# Use Node.js base image
FROM node:16

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Install nodemon globally
RUN npm install -g nodemon

# Copy the compiled JavaScript code from the dist/ folder
COPY dist/ .

# Expose the internal port for the service
EXPOSE 5350

# Start the service
CMD ["nodemon", "dist/server.js"]  
