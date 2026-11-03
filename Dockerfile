FROM node:22-bookworm-slim
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV DATA_DIR=/tmp/berry-data

EXPOSE 3000
CMD ["sh", "-c", "mkdir -p \"$DATA_DIR\"; if [ ! -f \"$DATA_DIR/store.json\" ]; then npm run seed; fi; npm run start"]
