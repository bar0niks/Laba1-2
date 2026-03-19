FROM node:22-alpine AS builder
WORKDIR /app

COPY package.json package.json
COPY tsconfig.base.json tsconfig.base.json
COPY packages/shared packages/shared
COPY apps/services/api-gateway apps/services/api-gateway
COPY docs docs

RUN npm install
RUN npm run build --workspace @gym/shared
RUN npm run build --workspace @gym/api-gateway

FROM node:22-alpine
WORKDIR /app

COPY --from=builder /app/node_modules node_modules
COPY --from=builder /app/apps/services/api-gateway/dist apps/services/api-gateway/dist
COPY --from=builder /app/packages/shared/dist packages/shared/dist
COPY apps/services/api-gateway/package.json apps/services/api-gateway/package.json
COPY packages/shared/package.json packages/shared/package.json
COPY docs docs

CMD ["node", "apps/services/api-gateway/dist/index.js"]
