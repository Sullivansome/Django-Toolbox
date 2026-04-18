# django-toolbox

Django app for **tool.brighteng.org** — shared utilities, templates, and static assets. This README is aimed at **how we work together** on the repo.

## Collaboration workflow

**Align before large changes.** For new tools, UX shifts, or anything that touches routing, i18n, or `data/`, open an issue or sync with maintainers first so parallel work does not collide.

**Use short-lived branches.** Branch from your shared default branch (e.g. `main`), keep commits focused, and prefer small PRs that are easy to review.

**Pull requests.** Each PR should:

- State **what** changed and **why** (problem or goal), not only the diff.
- Stay **scoped** — avoid unrelated refactors or drive-by formatting.
- **Match existing patterns** in the same file or app (naming, templates, i18n keys).
- If you touch user-facing strings, update **both** `data/messages_en.json` and `data/messages_zh.json`, and `data/tool_i18n.json` when tool copy changes, keeping locales in sync.
- When adding or editing tools, keep **`data/registry.json`** and tool metadata in sync; use **`scripts/export_tool_data.py`** when your workflow requires exporting or regenerating data.

**Reviews.** Reviewers check correctness, consistency with the rest of the site, and whether the change is minimal for the goal. Respond to feedback or clarify intent in comments; resolve threads when addressed.

**Conflicts.** If two people edit the same tool or JSON files, rebase or merge early and coordinate on `data/` and registry changes — those files are merge-sensitive.

## Getting set up locally

**Requirements:** Python **3.12+** and [**uv**](https://docs.astral.sh/uv/getting-started/installation/).

```bash
cd django-toolbox
cp .env.example .env   # optional for local dev
./scripts/dev.sh
```

`./scripts/dev.sh` runs `uv sync`, migrates, then `runserver` on `127.0.0.1` using the **first free port in 8000–8099**. If your shell has `VIRTUAL_ENV` from another project, either run `unset VIRTUAL_ENV` or use this script (it clears it).

**Manual equivalent:** `uv sync` → `uv run python manage.py migrate` → `uv run python manage.py runserver …`

**Useful paths for contributors:** `config/` (settings, URLs), `apps/core/` (locale, home, middleware), `apps/tools/` (tool views), `templates/`, `static/`, `data/` (registry, messages).

## Configuration (`.env`)

| Variable | Purpose |
|----------|---------|
| `DJANGO_SECRET_KEY` | Secret key; strong value in production |
| `DJANGO_DEBUG` | `1` dev / `0` production |
| `DJANGO_ALLOWED_HOSTS` | Comma-separated hosts |
| `PUBLIC_BASE_URL` | Canonical site URL |

See `.env.example` for defaults.

