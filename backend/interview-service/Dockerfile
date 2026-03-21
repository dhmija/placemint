FROM node:18-alpine
WORKDIR /app/interview-service
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 5011
CMD ["npm", "start"]
