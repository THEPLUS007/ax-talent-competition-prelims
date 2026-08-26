# Deployment

## Current code-server environment

The current host exposes code-server on port 8080 and forwards
`/proxy/5173/` to the web process on port 5173. Nginx and Caddy are not
active, and port 80 is not listening. The current public URL is therefore:

```text
http://theplusdev.kro.kr:8080/proxy/5173/
```

The web process must serve the production build. Do not expose `vite dev`.
Vite `base` remains `./`, so generated asset URLs stay below the code-server
proxy prefix. Preview forwards its prefix-relative `/api` requests to the API
process on `127.0.0.1:3000`.

```bash
cd /home/ubuntu/submission
npm ci
npm run lint
npm run build
npm run test:server -w @travel-blocks/api
# In another terminal:
npm run preview -w @travel-blocks/web
```

The API command above is the development/E2E provider and uses an in-memory
repository. For a persistent deployment, configure PostgreSQL and server-only
provider environment values, run `npm run db:migrate`, and replace the test
server command with:

```bash
npm run start -w @travel-blocks/api
```

## Managed production deployment

For a durable deployment, run the API and static web service under systemd or
another process supervisor and use Nginx/Caddy on ports 80/443. Route `/` to
the built web service and `/api/` to the API service. TLS is required before
the production secure session cookie can be used. Do not configure HMR for a
production preview.
