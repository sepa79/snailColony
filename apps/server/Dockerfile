# Build the NestJS server with pnpm
FROM node:20-alpine AS build
WORKDIR /app
RUN npm install -g pnpm
COPY package.json pnpm-workspace.yaml ./
COPY apps ./apps
COPY libs ./libs
RUN pnpm install
RUN pnpm --filter @snail/server... build

# Run the compiled server
FROM node:20-alpine
WORKDIR /app
COPY apps/server/package.json package.json
COPY --from=build /app/apps/server/dist ./dist
RUN npm install --omit=dev
EXPOSE 3000
CMD ["node", "dist/main.js"]
