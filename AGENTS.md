## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Agent Workflow For This Repository

When assisting with this archive project:

1. Add image files under `public/photos/<slug>/`.
2. Create one markdown card per photo story in `src/content/photos/*.md`.
3. Validate with `npm run check` and `npm run build`.
4. For local server publishing, use:

```bash
REMOTE_HOST=192.168.88.246 REMOTE_USER=adminr REMOTE_PATH=/var/www/history-archive npm run sync:local
```

Never store secrets in repository files. Use environment variables for any credentials.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)
