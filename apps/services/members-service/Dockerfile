FROM node:22-alpine AS builder
WORKDIR /app

COPY package.json package.json
COPY tsconfig.base.json tsconfig.base.json
COPY packages/shared packages/shared
COPY apps/services/members-service apps/services/members-service

RUN npm install
RUN npm run build --workspace @gym/shared
RUN npm run build --workspace @gym/members-service

FROM node:22-alpine
WORKDIR /app

COPY --from=builder /app/node_modules node_modules
COPY --from=builder /app/apps/services/members-service/dist apps/services/members-service/dist
COPY --from=builder /app/packages/shared/dist packages/shared/dist
COPY apps/services/members-service/package.json apps/services/members-service/package.json
COPY packages/shared/package.json packages/shared/package.json

CMD ["node", "apps/services/members-service/dist/index.js"]

