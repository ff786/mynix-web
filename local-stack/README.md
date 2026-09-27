# Local MYNIX platform

A private copy of the POS (database + backend) with sample data, so the
website can be tested against it without touching production.

```bash
./local-stack/setup.sh            # start (first run builds the POS backend image)
npm run dev                       # website → http://localhost:3000
```

POS frontend, from `Mynix POS/frontend` (the variable overrides its `.env`,
which points at production):

```bash
VITE_API_URL=http://localhost:8080/api npm run dev
```

The setup script prints the local POS admin login. Everything it creates is
local only: secrets live in `local-stack/.env` (gitignored), ports listen on
127.0.0.1, and SMS sending is switched off.

What to try:

1. Add a product in the local POS → it appears on the website within a minute.
2. Order it on the website with cash on delivery → it shows in the POS
   Sales list as a Cash sale, the customer is attached, stock goes down.
3. Track the order at /track with the order number and mobile number.

Stop with `docker compose -f local-stack/docker-compose.yml stop`; wipe and
start fresh with `./local-stack/setup.sh --reset`. The POS backend is built
from `../Mynix POS/backend` (override with `POS_BACKEND_DIR`).
