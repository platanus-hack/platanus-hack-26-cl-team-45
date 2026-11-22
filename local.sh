#!/bin/sh
# Levanta todo Audem en local con Docker, con su propia base: nada de lo que hagas acá llega a prod.
#
#   ./local.sh            levanta el stack (la primera vez instala dependencias y crea la encuesta de la hackatón)
#   docker compose down   lo baja; con -v además borra la base local
#
# Lee ANTHROPIC_API_KEY (y si están, ANTHROPIC_BASE_URL y OPENROUTER_API_KEY) de .env.
set -e
cd "$(dirname "$0")"
[ -f .env ] && { set -a; . ./.env; set +a; }
[ -n "$ANTHROPIC_API_KEY" ] || { echo "Falta ANTHROPIC_API_KEY en .env"; exit 1; }

docker compose up -d --wait backend dashboard

# The admin key lets the CLI deploy to the local backend; ADMIN_KEY is the app's own /admin password.
NUEVO=
if [ ! -f .env.docker ]; then
  NUEVO=1; export NUEVO
  CLAVE=$(docker compose exec -T backend ./generate_admin_key.sh | tail -1)
  printf 'CONVEX_SELF_HOSTED_ADMIN_KEY=%s\nADMIN_KEY_LOCAL=%s\n' "$CLAVE" "local-$(od -An -N6 -tx1 /dev/urandom | tr -d ' \n')" > .env.docker
fi
ADMIN_KEY_LOCAL=$(grep ^ADMIN_KEY_LOCAL= .env.docker | cut -d= -f2)

# First deploy + function env vars + the demo poll, in a throwaway container (values never printed).
docker compose run --rm -T \
  -e ANTHROPIC_API_KEY -e ANTHROPIC_BASE_URL -e OPENROUTER_API_KEY -e ADMIN_KEY_LOCAL -e NUEVO \
  app sh -c '
    set -e
    corepack enable
    [ -d node_modules/.bin ] || pnpm install --frozen-lockfile
    pnpm exec convex deploy -y
    set +e
    pnpm exec convex env set ANTHROPIC_API_KEY "$ANTHROPIC_API_KEY" >/dev/null
    [ -n "$ANTHROPIC_BASE_URL" ] && pnpm exec convex env set ANTHROPIC_BASE_URL "$ANTHROPIC_BASE_URL" >/dev/null
    [ -n "$OPENROUTER_API_KEY" ] && pnpm exec convex env set OPENROUTER_API_KEY "$OPENROUTER_API_KEY" >/dev/null
    pnpm exec convex env set ADMIN_KEY "$ADMIN_KEY_LOCAL" >/dev/null
    [ -n "$NUEVO" ] && pnpm exec convex run encuestas:crear "{\"clave\":\"$ADMIN_KEY_LOCAL\",\"pregunta\":\"¿Cómo ha sido tu experiencia en la Platanus Hack hasta ahora?\"}" 2>/dev/null || true
  '

echo
echo "Listo:"
echo "  app        http://localhost:5173"
echo "  dashboard  http://localhost:6791   (clave: CONVEX_SELF_HOSTED_ADMIN_KEY en .env.docker)"
echo "  admin      http://localhost:5173/admin   (clave: ADMIN_KEY_LOCAL en .env.docker)"
echo "  respuestas sintéticas: VITE_CONVEX_URL=http://127.0.0.1:3210 node evals/hackaton/subir.ts <slug>"
[ -z "$OPENROUTER_API_KEY" ] && echo "  ojo: sin OPENROUTER_API_KEY en .env no se transcriben audios (texto sí funciona)"
echo
docker compose up app
