# Use an official Node.js runtime as a parent image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /app/job-service

# Copy package.json and package-lock.json (if it exists)
COPY package*.json ./

# Install dependencies using npm ci for production
RUN npm ci --only=production

# Copy the rest of the application's source code
COPY . .

# Make port 5003 available
EXPOSE 5003

# Define the command to run your app
CMD ["node", "server.js"]