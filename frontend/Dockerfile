FROM node:22-alpine AS builder
WORKDIR /app

COPY package.json package.json
COPY tsconfig.base.json tsconfig.base.json
COPY packages/shared packages/shared
COPY apps/frontend apps/frontend

RUN npm install
RUN npm run build --workspace @gym/shared
RUN npm run build --workspace @gym/frontend

FROM nginx:1.27-alpine
COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/apps/frontend/dist /usr/share/nginx/html

