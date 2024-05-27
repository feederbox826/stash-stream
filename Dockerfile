FROM node:lts-alpine AS dev

WORKDIR /app
COPY . .
RUN npm i
CMD ["npm", "run", "dev"]
EXPOSE 5173