# Construction Safety Monitor

Real-time construction-site safety monitoring. Detects PPE compliance and unsafe
postures from a webcam or CCTV stream using **YOLO11** for PPE/person detection,
**MediaPipe** for pose estimation, and **RULA/REBA** scoring for ergonomic risk.
Workers sign in with Google, keep a profile, take a cognitive-fitness assessment,
and optionally sync Google Fit activity data.

---

## Architecture

Three processes and one managed database.

| Component | Stack | Port | Repo |
|---|---|---|---|
| **AI backend** | FastAPI + YOLO11 + MediaPipe | `8000` | this repo, `Backend/` |
| **Frontend** | React 19 + Vite + Tailwind | `5173` | this repo, `Frontend/` |
| **Auth server** | Node + Express + Prisma | `3000` | [BTP-auth-server](https://github.com/darkm4tter07/BTP-auth-server) |
| **Database + file storage** | Supabase (Postgres + Storage) | — | managed |

The AI backend is the only part that needs a GPU. Both back-end services share
the same Postgres database: the Python side owns the schema via Alembic, and
Prisma on the Node side is introspected from it.

---

## Prerequisites

- **NVIDIA GPU** with a current driver (CUDA 12.4+). No CUDA Toolkit install
  needed — the PyTorch wheels bundle their own runtime.
- **Python 3.12**
- **Node.js 20+** (22 LTS recommended)
- **Git**

Verify:

```bash
python3 --version     # 3.12.x   (Windows: py -3.12 --version)
node --version        # v20+
nvidia-smi            # lists your GPU and driver
```

Without a GPU everything still runs, but each frame takes several hundred
milliseconds instead of tens, and the stream visibly lags.

---

## 1. Clone

```bash
git clone https://github.com/darkm4tter07/Construction_Safety_BTP.git
git clone https://github.com/darkm4tter07/BTP-auth-server.git
cd Construction_Safety_BTP
```

The trained YOLO weights are committed directly in `Backend/yolo_models/`
(`yolo11n.pt` ≈ 5 MB, `yolo11s.pt` ≈ 19 MB). Confirm they downloaded at full
size — if either is only a few hundred bytes, the clone was incomplete.

These are **custom-trained PPE models**, not stock YOLO weights. Classes, in
index order: `Hardhat, Mask, NO-Hardhat, NO-Mask, NO-Safety Vest, Person,
Safety Cone, Safety Vest, machinery, vehicle`. Note that **Person is index 5**,
and that index is relied upon by `Backend/app/services/worker_tracking_service.py`.

---

## 2. AI backend

### Linux (Ubuntu 24.04)

```bash
sudo apt update
sudo apt install -y python3-venv python3-pip libgl1 libglib2.0-0 libglib2.0-dev

cd Backend
python3 -m venv venv
source venv/bin/activate
```

### Windows (PowerShell)

```powershell
cd Backend
py -3.12 -m venv venv
venv\Scripts\activate
```

### Both — install, GPU PyTorch first

```bash
python -m pip install --upgrade pip

pip install torch==2.6.0+cu124 torchvision==0.21.0+cu124 torchaudio==2.6.0+cu124 \
  --index-url https://download.pytorch.org/whl/cu124

pip install -r requirements.txt
```

Confirm the GPU is actually in use:

```bash
python -c "import torch; print(torch.__version__, torch.cuda.is_available(), torch.cuda.get_device_name(0))"
```

`False` means CPU-only wheels were installed — uninstall `torch torchvision
torchaudio` and repeat the install with the `--index-url` flag.

> Ubuntu tip: if pip fails on disk quota while downloading the ~2 GB of wheels,
> set a bigger temp dir first — `mkdir -p ~/tmp-pip && export TMPDIR=~/tmp-pip`.

---

## 3. Configuration

Each component has a `.env`. Copy the template beside it and fill in real values:

```bash
cp Backend/.env.example  Backend/.env
cp Frontend/.env.example Frontend/.env
cp ../BTP-auth-server/.env.example ../BTP-auth-server/.env
```

Each template documents every variable. Two rules that cause silent, hard-to-read
failures if broken:

- `SECRET_KEY` in `Backend/.env` **must be byte-for-byte identical** to
  `JWT_SECRET` in the auth server's `.env`. The auth server signs the JWTs; the
  Python service verifies them.
- `GOOGLE_REDIRECT_URI` must match an *Authorised redirect URI* on the Google
  OAuth client exactly — scheme, port, no trailing slash.

You will need: a Supabase project (Postgres + a **public** Storage bucket named
`worker-profiles`), a Google Cloud OAuth client with the Fitness API enabled,
and an OpenWeatherMap API key.

### Database schema

Only needed on a **fresh** database — skip if you were given an existing one.

```bash
cd Backend
source venv/bin/activate          # Windows: venv\Scripts\activate
alembic upgrade head              # creates the 6 tables
python scripts/create_admin.py    # edit the email inside first
```

Create the admin **before** anyone signs in with Google — the OAuth callback
creates unknown users as `WORKER`, and the script then fails on the unique-email
constraint. If that already happened, fix it with SQL instead:

```sql
update users set role = 'ADMIN' where email = 'you@example.com';
```

Then sign out and back in — the role is carried in the JWT, so a refresh alone
won't pick it up.

---

## 4. Auth server

```bash
cd ../BTP-auth-server
npm install          # .env must exist first; postinstall runs prisma generate
npx prisma generate
npm run dev
```

Check <http://localhost:3000/health> returns `{"status":"ok"}`.

---

## 5. Frontend

```bash
cd Frontend
npm install
npm run dev
```

`src/Constant.js` points `AUTH_URL` at the hosted auth server by default. **To
run fully locally, swap to the commented localhost line:**

```js
// export const AUTH_URL = 'https://btp-auth-server-8dnd.onrender.com';
export const AUTH_URL = 'http://localhost:3000';
```

This matters: after Google sign-in the auth server redirects to *its own*
configured `FRONTEND_URL`, so a local frontend paired with the hosted auth server
sends the token to the wrong origin and login appears to do nothing.

Open <http://localhost:5173> — use `localhost`, not `127.0.0.1`, since that is
the origin registered with Google and listed in `ALLOWED_ORIGINS`.

---

## Running day to day

Three terminals:

```bash
# 1  auth server
cd BTP-auth-server && npm run dev

# 2  AI backend
cd Construction_Safety_BTP/Backend && source venv/bin/activate
uvicorn app.main:app --port 8000

# 3  frontend
cd Construction_Safety_BTP/Frontend && npm run dev
```

Drop `--reload` from uvicorn outside development — it reloads the models and
drops every WebSocket on each file change.

First backend start takes 20–60 s while YOLO and MediaPipe load. Look for
`Using device: cuda` then `SafetyMonitor initialized successfully!`, and check
<http://localhost:8000/health> reports both models loaded.

### Verify it works

1. `localhost:3000/health` → `{"status":"ok"}`
2. `localhost:8000/health` → both models `true`
3. Sign in at `localhost:5173` → lands on `/admin/dashboard` for an admin
4. Click **Camera** → two live panels, boxes left, skeleton right
5. The backend logged `Using device: cuda` at startup → the GPU is being used
6. **CCTV** with `app/uploads/test.mp4` → sample clip runs through detection

The FPS readout tops out around **5 for the webcam** and **8–10 for CCTV** by
design — the browser sends at most 5 frames a second and the backend discards
frames arriving closer than 0.1 s apart. A low number there does not mean the GPU
is idle.

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| `torch.cuda.is_available()` is `False` | CPU wheels installed. Reinstall with `--index-url .../cu124`. Update the GPU driver. |
| `mediapipe` has no matching distribution | Python is newer than 3.12. Rebuild the venv with 3.12. |
| Every authenticated call returns 401 | `SECRET_KEY` ≠ `JWT_SECRET`, or a stale token. Clear `localStorage` and sign in again. |
| `redirect_uri_mismatch` from Google | The URI differs from the Google client entry. Changes can take minutes to propagate. |
| Login redirects but nothing happens | Local frontend pointed at the hosted auth server. See step 5. |
| CORS error in the console | Add the origin to `ALLOWED_ORIGINS` (backend) and `FRONTEND_URL` (auth server). |
| Signed in but got the worker page | Your row is `role = WORKER`. Run the SQL above, then re-login. |
| Video is laggy / FPS below 3 | Running on CPU, or using `yolo11s.pt`. Check `torch.cuda.is_available()`; switch `YOLO_MODEL_PATH` back to `yolo11n.pt`. |
| Profile photo upload fails | Supabase bucket must be named `worker-profiles`, public, with anon insert/update/delete policies. |
| Steps and heart rate always 0 | That Google account has no Google Fit data. Not a bug. |
| Google login breaks after ~a week | The OAuth consent screen is in *Testing*, so refresh tokens expire in 7 days. Reconnect Google Fit. |
| All database calls suddenly fail | A free Supabase project pauses after ~1 week idle. Resume it from the dashboard. |

---

## Notes

- **Security:** the app tables must have RLS enabled in Supabase. The anon key
  ships in the browser bundle, so with RLS off the entire `users`,
  `worker_profiles` and `fitness_connections` content — including stored Google
  tokens — is readable by anyone with the deployed URL.
- **`/tracking/*` endpoints are unauthenticated.** Fine on a LAN; add a check
  before exposing port 8000 publicly.
- **A deployed HTTPS frontend cannot reach a local AI backend** — browsers block
  `ws://` and `http://` from an https page. Run the frontend locally for the
  dashboard, or put the backend behind an HTTPS tunnel.
- **Google Fit APIs are deprecated** upstream. If they are withdrawn, fitness
  numbers read as zero; detection, pose, profiles and assessments are unaffected.
