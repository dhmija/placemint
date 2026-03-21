# --- Stage 1: Build the React app ---
FROM node:18-alpine AS builder

# Define build argument for the reCAPTCHA key
ARG REACT_APP_RECAPTCHA_SITE_KEY

WORKDIR /app

COPY package*.json ./

#
# --- THIS IS THE FIX ---
# Use --legacy-peer-deps to solve the 'ajv' conflict
#
RUN npm install --legacy-peer-deps

# Copy the rest of the app's source code
COPY . .

#
# Pass the ARG into the build command
#
RUN REACT_APP_RECAPTCHA_SITE_KEY=${REACT_APP_RECAPTCHA_SITE_KEY} npm run build

# --- Stage 2: Serve the app with Nginx ---
FROM nginx:stable-alpine

COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]