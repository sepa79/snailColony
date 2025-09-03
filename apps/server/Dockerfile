# Build the NestJS server
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json tsconfig.json tsconfig.build.json .
RUN npm install
COPY . .
RUN npm run build

# Run the compiled server
FROM node:20-alpine
WORKDIR /app
COPY package.json .
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/main.js"]
