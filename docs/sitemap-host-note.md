# Sitemap host — known limitation (action required before go-live)

## Symptom

`https://main--eds-learning--pdave03.aem.page/sitemap.xml` (and the `.aem.live`
equivalent) render every `<loc>` as:

```xml
<loc>https://undefined/us/en</loc>
```

The URLs are otherwise correct (right paths, right page set) — only the **host**
is `undefined`.

## Root cause

The sitemap generator resolves the absolute-URL host from, in order:

1. `origin` in `helix-sitemap.yaml`
2. `cdn.prod.host` in the site config

**AEM will not use its own delivery endpoints (`*.aem.page` / `*.aem.live`) as
the canonical host.** This is by design — those are preview/delivery
infrastructure hosts and must not be presented to search engines as canonical
URLs. Two pieces of direct evidence:

- Setting `origin: https://main--eds-learning--pdave03.aem.live` in
  `helix-sitemap.yaml` (merged to `main`) did **not** take effect — the host
  still resolved to `undefined`.
- Attempting to set `cdn.prod.host` to the same aem.live host via the config API
  was rejected outright:

  ```
  HTTP 400  x-error: /cdn/prod/host AEM endpoints not allowed
  ```

With no real production domain configured, the host has nothing valid to resolve
to, so it renders as `undefined`.

## Resolution (required before production launch)

Set a **real production domain** (the domain the site will actually be served
from behind your CDN). Either mechanism works:

- **Preferred — site config:** set `cdn.prod.host` to the production hostname,
  e.g.

  ```
  POST https://admin.hlx.page/config/pdave03/sites/eds-learning.json
  { ... , "cdn": { "prod": { "host": "www.example.com" } } }
  ```

- **Or — per-sitemap override:** set `origin` (including protocol) in
  `helix-sitemap.yaml`:

  ```yaml
  sitemaps:
    default:
      origin: https://www.example.com
      source: /query-index.json
      destination: /sitemap.xml
  ```

After setting the host, re-index / re-preview the content so the sitemap
regenerates, then confirm the `<loc>` values use the production domain. The
`Sitemap:` line in the production `robots.txt` should point at the same host.

## Status

Deferred by decision — the site has no production domain yet. The sitemap
structure, page set, and exclusions are otherwise correct; only the canonical
host is pending a real domain. This is expected AEM behavior on `*.aem.live` and
does not indicate a config error.
