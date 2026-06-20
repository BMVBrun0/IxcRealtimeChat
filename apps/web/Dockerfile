FROM node:20-alpine

WORKDIR /workspace
ENV NEXT_TELEMETRY_DISABLED=1

COPY package.json ./
COPY apps/server/package.json apps/server/package.json
COPY apps/web/package.json apps/web/package.json

RUN npm install --workspaces --include-workspace-root --no-fund --no-audit

COPY . .

RUN mkdir -p /workspace/uploads/avatars \
  && chown -R 1000:1000 /workspace

CMD ["sh", "/workspace/scripts/docker/web-entrypoint.sh"]
