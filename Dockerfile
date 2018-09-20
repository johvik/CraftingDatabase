FROM node:8.12.0-alpine
EXPOSE 3000
WORKDIR /app
COPY *.json *.pem ./
COPY src src
RUN npm install && \
    npm run build && \
    rm -r src && \
    npm prune --production && \
    apk add --no-cache curl && \
    apk add --no-cache git && \
    git clone https://github.com/johvik/CraftingProfitWeb.git && \
    apk del git && \
    cd CraftingProfitWeb && \
    npm install && \
    npm run build && \
    cd .. && \
    mkdir static && \
    cp CraftingProfitWeb/index.html static/ && \
    cp -r CraftingProfitWeb/dist static/ && \
    rm -rf CraftingProfitWeb
