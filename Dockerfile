FROM node:22-alpine AS build
WORKDIR /app/webapp
COPY webapp/package*.json ./
RUN npm ci --no-audit --no-fund || npm install --no-audit --no-fund
COPY webapp/ ./
# Option lists in src/data are imported from the repo root at build time.
COPY *.json /app/
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
