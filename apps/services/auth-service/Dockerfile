FROM node:22-alpine AS builder
WORKDIR /app

COPY package.json package.json
COPY tsconfig.base.json tsconfig.base.json
COPY packages/shared packages/shared
COPY apps/services/auth-service apps/services/auth-service

RUN npm install
RUN npm run build --workspace @gym/shared
RUN npm run build --workspace @gym/auth-service

FROM node:22-alpine
WORKDIR /app

COPY --from=builder /app/node_modules node_modules
COPY --from=builder /app/apps/services/auth-service/dist apps/services/auth-service/dist
COPY --from=builder /app/packages/shared/dist packages/shared/dist
COPY apps/services/auth-service/package.json apps/services/auth-service/package.json
COPY packages/shared/package.json packages/shared/package.json

CMD ["node", "apps/services/auth-service/dist/index.js"]

