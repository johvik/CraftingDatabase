FROM node:8.12.0-alpine
EXPOSE 3000
WORKDIR /app
COPY *.json ./
COPY src src
RUN npm install && \
    npm run build && \
    rm -r src && \
    npm prune --production && \
    apk add --no-cache curl
