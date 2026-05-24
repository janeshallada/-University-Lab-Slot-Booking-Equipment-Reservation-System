FROM node:20-bullseye AS build
WORKDIR /app
COPY frontend/package.json frontend/package.json
RUN cd frontend && npm install
COPY frontend frontend
RUN cd frontend && npm run build

FROM node:20-bullseye
WORKDIR /app
COPY backend/package.json backend/package.json
RUN cd backend && npm install --omit=dev
COPY backend backend
COPY --from=build /app/frontend/dist frontend/dist
WORKDIR /app/backend
RUN node src/db/seed.js
EXPOSE 4000
CMD ["node", "src/index.js"]
