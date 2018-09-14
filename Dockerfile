FROM node:8.12.0-alpine
EXPOSE 3000
ADD . /app
WORKDIR /app
RUN npm install
RUN npm run build
RUN apk add --no-cache curl
