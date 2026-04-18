# Use an official Node.js runtime as a parent image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /app/auth-service

# Copy package.json and package-lock.json (if it exists)
COPY package*.json ./

# Install dependencies without requiring a perfectly synced lockfile
RUN npm install --omit=dev

# Copy the rest of the application's source code
COPY . .

# Make port 5001 available
EXPOSE 5001

# Define the command to run your app
CMD ["node", "server.js"]