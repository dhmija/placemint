FROM node:18-alpine
WORKDIR /app/messaging-service
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 5012
CMD ["node", "server.js"]
