# Deploy on Kubernetes (self-managed / on-prem)

Two services:

- **frontend** — nginx serves the built Vite SPA and proxies `/api/*` → `backend:3001`.
  Exposed on **port 11112** on each node via `hostPort` (11112 is below the default
  NodePort range, so `hostPort` avoids having to widen `--service-node-port-range`).
- **backend** — Node/Express (`backend/src/server.js`, port 3001) running the same
  canonical parser (`backend/src/services/receiptParser.js`) used by the Vercel function.

Because nginx proxies `/api` **server-side**, the browser makes only same-origin
requests → **no CORS, no app-code changes**. On a residential-style egress IP the
parser works the same as on your laptop.

## Prerequisites

- `kubectl` configured against your cluster
- Docker (or podman/buildah) to build images
- (Optional, for the Ingress alternative) an Ingress controller — **k3s ships with Traefik
  built in**; standalone clusters need ingress-nginx or similar

## 1. Build the images (from the repo root)

```bash
docker build -f frontend/Dockerfile -t receipt-parser-frontend .
docker build -f backend/Dockerfile  -t receipt-parser-backend .
```

If your cluster nodes have a **different CPU architecture** than your build machine
(e.g. Apple Silicon arm64 → amd64 nodes), build for the target arch:

```bash
docker build --platform linux/amd64 -f frontend/Dockerfile -t receipt-parser-frontend .
docker build --platform linux/amd64 -f backend/Dockerfile  -t receipt-parser-backend .
```

## 2. Make the images available to the cluster

The Deployments use `imagePullPolicy: IfNotPresent`, so the image must already exist on
each node that runs a pod (the cluster won't pull from Docker Hub).

### k3s (containerd) — the common on-prem case

k3s runs **containerd, not Docker**, so a `docker build` image is not visible to it.
Build where you have Docker, then import into k3s:

```bash
# build machine
docker save receipt-parser-frontend:latest -o frontend.tar
docker save receipt-parser-backend:latest  -o backend.tar

# on the k3s node (after copying the .tar files over)
sudo k3s ctr images import frontend.tar
sudo k3s ctr images import backend.tar
```

If Docker is on the node itself, one-liner per image:
`docker save receipt-parser-frontend:latest | sudo k3s ctr images import -`

Multi-node k3s: import on every node a pod may land on, or use a registry (below).

### Other runtimes / multi-node (registry)

For a Docker-runtime node, or multi-node where you'd rather not import per node, run a
local registry and push, then point the image names in `backend.yaml` / `frontend.yaml`
at `localhost:5000/...` and set `imagePullPolicy: Always` (or use a version tag instead
of `:latest`).

## 3. Apply the manifests

```bash
kubectl apply -k k8s/          # via kustomize (creates the namespace too)
# or, without kustomize:
kubectl apply -f k8s/namespace.yaml && kubectl apply -f k8s/
```

Check that everything is up:

```bash
kubectl -n receipt-parser get pods,svc
```

## 4. Reach the app

The frontend is exposed on **port 11112** on every node running a frontend pod (`hostPort`):

```bash
kubectl get nodes -o wide        # take any node's INTERNAL-IP / EXTERNAL-IP
# then open in a browser:
http://<node-ip>:11112
```

`hostPort` notes:

- The scheduler places **at most one frontend pod per node** (11112 can't bind twice on
  one node). The 2 replicas spread across nodes automatically; on a single-node cluster
  scale down so the extra pod isn't stuck Pending:
  ```bash
  kubectl -n receipt-parser scale deployment frontend --replicas=1
  ```
- Want exactly one pod per node with no counting? Convert the Deployment to a DaemonSet.

Alternatives (if you'd rather not use `hostPort`):

- **port-forward** (local test): `kubectl -n receipt-parser port-forward svc/frontend 8080:80` → http://localhost:8080
- **Ingress** (needs a controller): see `k8s/ingress.yaml`, point `receipt-parser.local`
  at the controller IP. On **k3s** the default controller is Traefik — set
  `ingressClassName: traefik` (the manifest defaults to `nginx`). (A plain NodePort
  Service on 11112 would require widening `--service-node-port-range` on the API server,
  since 11112 < 30000.)

## Verify add-receipt end to end

```bash
# Through the frontend nginx (same path the browser uses):
curl -sS -X POST http://<node-ip>:11112/api/receipts/parse \
  -H 'Content-Type: application/json' -d '{"url":"<your-qr-url>"}'
```

An empty body returns `{"error":"URL is required"}` (HTTP 500 from the Express proxy —
that's expected, it confirms the request reached the backend through nginx).

## Notes

- **Egress:** the backend calls out to `suf.purs.gov.rs`. On a residential/on-prem IP it
  works; on a cloud IP it may be blocked (same risk as Vercel).
- **Frontend exposure:** 11112 is a `hostPort` on the frontend container, not a Service
  port — see "Reach the app" for the one-pod-per-node caveat.
- **Updates:** because images use the `:latest` tag with `IfNotPresent`, rebuilds won't
  auto-pull. Bump a version tag (and set `imagePullPolicy: Always`), or run
  `kubectl -n receipt-parser rollout restart deployment frontend backend`.
- **Scaling:** `replicas: 2` per service is a starting point; the app is stateless except
  for each browser's own localStorage, so it scales horizontally.
