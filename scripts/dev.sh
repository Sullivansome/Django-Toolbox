#!/usr/bin/env bash
# Local dev: install deps, migrate, run Django.
# Usage:
#   ./scripts/dev.sh                    # first free port on 127.0.0.1 in 8000-8099 (bind test, not lsof)
#   ./scripts/dev.sh 8001               # explicit: port 8001 on 127.0.0.1
#   ./scripts/dev.sh 0.0.0.0:8000       # bind on all interfaces

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

# Avoid uv warnings when the shell still has VIRTUAL_ENV from another project
# (e.g. after renaming/moving the repo). Use this project's .venv via uv run.
unset VIRTUAL_ENV

if ! command -v uv >/dev/null 2>&1; then
  echo "uv is not installed. Install: https://docs.astral.sh/uv/getting-started/installation/" >&2
  exit 1
fi

echo "==> uv sync"
uv sync

if [[ ! -f .env ]] && [[ -f .env.example ]]; then
  echo "==> (optional) cp .env.example .env  # for secrets / DEBUG / ALLOWED_HOSTS"
fi

echo "==> migrate"
uv run python manage.py migrate --noinput

echo "==> runserver (Ctrl+C to stop)"
if [[ $# -eq 0 ]]; then
  chosen=""
  for p in {8000..8099}; do
    if uv run python -c "import socket; s=socket.socket(); s.bind(('127.0.0.1', $p)); s.close()" 2>/dev/null; then
      chosen=$p
      break
    fi
  done
  if [[ -z "$chosen" ]]; then
    echo "No free TCP port on 127.0.0.1 in range 8000-8099." >&2
    exit 1
  fi
  if [[ "$chosen" != "8000" ]]; then
    echo "==> Port 8000 busy on 127.0.0.1; starting at http://127.0.0.1:${chosen}/" >&2
  fi
  set -- "127.0.0.1:${chosen}"
fi

exec uv run python manage.py runserver "$@"
