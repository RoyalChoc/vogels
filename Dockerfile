FROM node:22-alpine AS build
WORKDIR /app/webapp
COPY webapp/package*.json ./
RUN npm ci
COPY webapp/ ./
RUN npm run build

FROM node:22-alpine AS runtime
ENV NODE_ENV=production \
    PORT=5173 \
    DATA_DIR=/data \
    SEED_DIR=/seed
WORKDIR /app/webapp
COPY --from=build /app/webapp/dist ./dist
COPY webapp/server.js ./server.js
COPY *.json /seed/
RUN mkdir -p /data && chown -R node:node /data /seed
USER node
EXPOSE 5173
CMD ["node", "server.js"]
