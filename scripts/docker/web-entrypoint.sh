set -eu

if [ "${NODE_ENV:-development}" = "production" ]; then
  npm run build -w apps/web
  exec npm run start -w apps/web -- --hostname 0.0.0.0 --port 3000
fi

exec npm run dev -w apps/web -- --hostname 0.0.0.0 --port 3000
