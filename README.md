# Nada Yasser Portfolio (Behance-powered)

A Next.js App Router portfolio site that pulls public project data from Behance and renders a designer-focused portfolio experience.

## Setup

1. Install dependencies

```bash
pnpm install
```

2. Configure environment

```bash
cp .env.example .env
```

Update `BEHANCE_PROFILE_URL` if needed.

3. Run locally

```bash
pnpm dev
```

## Behance Fetching & Caching

- The site uses public Behance pages (no API key required).
- Requests are cached with Next.js `revalidate` (daily) and an in-memory LRU cache in development.
- Pagination is respected and capped at 50 projects.

### Static Build Cache (Optional)

If you want to avoid live network requests during builds (recommended for CI/Vercel), generate a cache file:

```bash
pnpm behance:cache
```

Then set:

```bash
BEHANCE_STATIC_CACHE=1
```

This will load data from `public/behance-cache.json` at build/runtime.

### Quick Fetch Test

```bash
pnpm fetch:behance
```

Outputs the number of projects parsed.

## Respecting Behance

- Only public pages are fetched.
- No login or protected data is accessed.
- Requests are rate-limited and cached.
- Each project page links back to Behance for attribution.

## Notes

If parsing fails or Behance changes markup, the site falls back to `lib/manualProjects.ts` so builds still succeed.
