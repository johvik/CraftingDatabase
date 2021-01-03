FROM node:14.15-alpine
EXPOSE 3000
WORKDIR /app
COPY .eslintrc.js *.json *.pem ./
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
    cp -r CraftingProfitWeb/dist/ static/ && \
    rm -rf CraftingProfitWeb
