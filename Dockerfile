# FlowForge — production Docker image
# Build:  docker build -t flowforge .
# Run:    docker run -p 3000:3000 flowforge

FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --production=false

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
# writable data dir for workflows & run records
RUN mkdir -p data/workflows data/runs data/outputs
EXPOSE 3000
CMD ["npm", "run", "start"]
