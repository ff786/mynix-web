#!/usr/bin/env bash
# Starts a local copy of the MYNIX platform (POS database + POS backend) with
# sample data and points the website at it. Safe to re-run.
#
#   ./local-stack/setup.sh          start / update
#   ./local-stack/setup.sh --reset  wipe the local database and start fresh
set -euo pipefail
cd "$(dirname "$0")"

if [[ "${1:-}" == "--reset" ]]; then
  docker compose down -v
fi

# --- Local-only secrets (generated once, kept in local-stack/.env, gitignored) ---
if [[ ! -f .env ]]; then
  umask 077
  {
    echo "LOCAL_DB_PASSWORD=$(openssl rand -hex 16)"
    echo "LOCAL_JWT_SECRET=$(openssl rand -base64 48 | tr -d '\n')"
    echo "LOCAL_ADMIN_PASSWORD=local-$(openssl rand -hex 6)"
    echo "LOCAL_STORE_PASSWORD=$(openssl rand -hex 24)"
  } > .env
fi
set -a; source .env; set +a

echo "→ Building and starting the POS database and backend (first build takes a few minutes)…"
docker compose up -d --build

echo -n "→ Waiting for the POS backend"
for _ in $(seq 1 90); do
  code=$(curl -s -o /dev/null -w '%{http_code}' http://localhost:8080/api/test || true)
  [[ "$code" == "401" || "$code" == "403" ]] && break
  echo -n "."; sleep 2
done
echo
[[ "$code" == "401" || "$code" == "403" ]] || { echo "POS backend didn't start — see: docker compose -f local-stack/docker-compose.yml logs pos-backend"; exit 1; }

psql_db() { docker compose exec -T db psql -v ON_ERROR_STOP=1 -q -U mynix -d mynix_pos "$@"; }

echo "→ Setting local logins"
psql_db -v admin_pw="$LOCAL_ADMIN_PASSWORD" -v store_pw="$LOCAL_STORE_PASSWORD" <<'SQL'
CREATE EXTENSION IF NOT EXISTS pgcrypto;
-- The POS creates its admin on first start; give it a local-only password.
UPDATE users SET password_hash = crypt(:'admin_pw', gen_salt('bf', 10)) WHERE role = 'ADMIN';
-- The website's server account: can only read the catalogue and place orders.
INSERT INTO users (full_name, username, password_hash, role, active)
VALUES ('Online store (website)', 'online-store', crypt(:'store_pw', gen_salt('bf', 10)), 'ONLINE_STORE', true)
ON CONFLICT (username) DO UPDATE
  SET password_hash = EXCLUDED.password_hash, role = 'ONLINE_STORE', active = true;
SQL
ADMIN_USER=$(psql_db -At -c "SELECT username FROM users WHERE role = 'ADMIN' ORDER BY id LIMIT 1")

echo "→ Adding the sample catalogue"
node seed-catalog.mjs http://localhost:8080/api "$ADMIN_USER" "$LOCAL_ADMIN_PASSWORD"

echo "→ Pointing the website at the local POS (.env.local)"
ENV_FILE=../.env.local
touch "$ENV_FILE"
# Make sure what we append starts on its own line.
[[ -s "$ENV_FILE" && -n "$(tail -c1 "$ENV_FILE")" ]] && echo >> "$ENV_FILE"
for key in POS_API_URL POS_STORE_USERNAME POS_STORE_PASSWORD; do
  sed -i '' "/^${key}=/d" "$ENV_FILE"
done
{
  echo "POS_API_URL=http://localhost:8080/api"
  echo "POS_STORE_USERNAME=online-store"
  echo "POS_STORE_PASSWORD=$LOCAL_STORE_PASSWORD"
} >> "$ENV_FILE"
# Customer sign-in cookies, and sample bank details — only if not set yet.
grep -q '^CUSTOMER_SESSION_SECRET=' "$ENV_FILE" || echo "CUSTOMER_SESSION_SECRET=$(openssl rand -hex 32)" >> "$ENV_FILE"
grep -q '^BANK_TRANSFER_DETAILS=' "$ENV_FILE" ||
  echo 'BANK_TRANSFER_DETAILS="Bank: Sample Bank (local test)\nAccount name: MYNIX (PVT) LTD\nAccount no: 0000 0000 0000\nBranch: Colombo"' >> "$ENV_FILE"

cat <<EOF

Local platform is running.

  POS backend   http://localhost:8080/api
  POS frontend  run in "Mynix POS/frontend":  VITE_API_URL=http://localhost:8080/api npm run dev
                then open http://localhost:5173 and sign in as
                  username: $ADMIN_USER
                  password: $LOCAL_ADMIN_PASSWORD   (local copy only)
  Website       npm run dev  →  http://localhost:3000
  SMS codes     SMS is off locally; read codes with:
                docker compose -f local-stack/docker-compose.yml logs pos-backend | grep "verification code"

Stop:   docker compose -f local-stack/docker-compose.yml stop
Reset:  ./local-stack/setup.sh --reset
EOF
