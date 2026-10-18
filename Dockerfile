FROM mcr.microsoft.com/playwright:v1.64.1-noble

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY worker ./worker

ENV NODE_ENV=production
ENV TTANG_AUTOMATION_PORT=8787
ENV TTANG_AUTOMATION_HOST=0.0.0.0
EXPOSE 8787
CMD ["node", "worker/server.mjs"]
