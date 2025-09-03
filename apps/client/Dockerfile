# Build the Vite client with pnpm
FROM node:20-alpine AS build
WORKDIR /app
RUN npm install -g pnpm
COPY package.json pnpm-workspace.yaml ./
COPY apps ./apps
COPY libs ./libs
RUN pnpm install
RUN pnpm --filter @snail/client... build

# Serve the built client with nginx
FROM nginx:alpine
COPY --from=build /app/apps/client/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
