FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json tsconfig.base.json ./
COPY shared-types ./shared-types
COPY frontend ./frontend
RUN npm install
RUN npm run build -w @gym/shared-types
RUN npm run build -w @gym/frontend-common
RUN npm run build -w @gym/dashboard-mf

FROM nginx:1.27-alpine
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/frontend/remotes/dashboard-mf/dist /usr/share/nginx/html
