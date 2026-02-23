# Build the NestJS server with pnpm
FROM node:20-alpine AS build
WORKDIR /app
RUN npm install -g pnpm
COPY package.json pnpm-workspace.yaml .npmrc ./
COPY apps ./apps
COPY libs ./libs
RUN pnpm install
RUN pnpm --filter @snail/server build
RUN pnpm --filter @snail/server deploy --prod server-deploy

# Run the compiled server
FROM node:20-alpine
WORKDIR /app
COPY --from=build /app/server-deploy .
EXPOSE 3000
CMD ["node", "dist/main.js"]
