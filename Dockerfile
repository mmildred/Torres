FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --no-audit --no-fund
COPY . .
ENV HOST=0.0.0.0
EXPOSE 4000
CMD ["npm","start"]
