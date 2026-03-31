FROM node:20-alpine

RUN apk add --no-cache libc6-compat

WORKDIR /app

COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

EXPOSE 3000

ENV PORT=3000 \
    HOSTNAME="0.0.0.0"

CMD ["npm", "run", "dev"]
