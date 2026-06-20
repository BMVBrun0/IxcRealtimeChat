set -eu

if [ "${NODE_ENV:-development}" = "production" ] && [ "${CLUSTER_ENABLED:-false}" = "true" ]; then
  npm run build -w apps/server
  exec npm run start -w apps/server
fi

exec npm run dev -w apps/server
