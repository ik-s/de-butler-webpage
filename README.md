# De-Butler

**Kwangwoon University Blockchain Club 2026**  
*Your Butler for the Decentralized Era*

<div align="center">
  <img width="800" alt="De-Butler Logo" src="public/logo.jpg" />
  <p>광운대학교 블록체인 학회 De-Butler 공식 웹사이트입니다.</p>
</div>

## Overview

De-Butler 웹사이트는 학회 소개, 활동 사진, 이벤트/세션 기록을 보여주는 React SPA와 이를 관리하는 Express API로 구성되어 있습니다.
운영 데이터는 SQLite에 저장되며, 관리자 로그인 후 Activities와 Events를 생성, 수정, 삭제할 수 있습니다.

## Features

- Home: 학회 소개, 최신 WHAT DOES 이벤트, 예정된 UPCOMING 일정, 활동 이미지 그리드
- About: 학회 비전과 활동 방식 소개
- Activities: 활동 기록 목록, 이미지 업로드, 관리자 CRUD
- Events: WHAT DOES/UPCOMING 탭, 예정/지난 일정 분리, 관리자 CRUD
- Admin: 토큰 기반 관리자 세션, Activities/Events 관리 UI
- Uploads: 활동 이미지를 서버에서 최적화 후 `/uploads/activities`로 제공

## Tech Stack

- Frontend: React 19, TypeScript, Vite, React Router
- Styling: Tailwind CSS 4
- Motion/Icon: Motion, Lucide React
- Backend: Express, Node 22
- Database: SQLite via `better-sqlite3`
- Image processing: Sharp
- Production: Docker Compose, Caddy

## Project Structure

```text
src/                 React app and API client code
server/              Express API, auth, repositories, SQLite setup
public/              Static public assets
docs/deployment/     Deployment and backup notes
dist/                Vite production build output
```

Event content shown on the home page and `/events` comes from `/api/events`. Do not add hard-coded fallback event lists in the frontend, because deleted or completed events must stay consistent across browsers and devices.

## Local Setup

Prerequisites:

- Node.js 22 recommended
- npm

Install dependencies:

```sh
npm install
```

Create a local environment file:

```sh
cp .env.example .env
```

For local admin login, add these values to `.env`:

```env
ADMIN_USERNAME=De-Butler
ADMIN_PASSWORD=replace-with-local-password
ADMIN_TOKEN_SECRET=replace-with-at-least-32-random-characters
ADMIN_SESSION_TTL_SECONDS=28800
```

Run the API server:

```sh
npm run dev:server
```

Run the Vite dev server in another terminal:

```sh
npm run dev
```

Open:

- Frontend: `http://localhost:3000`
- API health: `http://localhost:3001/api/health`

## Scripts

```sh
npm run dev          # Vite dev server on port 3000
npm run dev:server   # Express API with tsx watch
npm run start:server # Express API production entrypoint
npm run test:ui      # React/API-client tests
npm run test:server  # Express API tests
npm run lint         # TypeScript check
npm run build        # Vite production build
npm run preview      # Preview built frontend
```

## Production Deployment

Production is intended to run with Docker Compose:

```sh
cp .env.production.example .env.production
```

Edit `.env.production` and set:

- `ADMIN_PASSWORD`
- `ADMIN_TOKEN_SECRET`

Build and start:

```sh
docker compose up -d --build
```

Check status:

```sh
docker compose ps
docker compose logs --tail=80 app
docker compose logs --tail=80 web
```

Update an existing VM deployment:

```sh
git pull --ff-only origin main
docker compose up -d --build
docker image prune -f
```

More deployment and backup details are in [docs/deployment/free-vm-docker.md](docs/deployment/free-vm-docker.md).

## Data And Backups

Production data is intentionally outside the container image:

- SQLite database: `/data/de-butler.sqlite` in the `db_data` Docker volume
- Uploaded files: `/uploads` in the `upload_data` Docker volume

Back up both before destructive server work. See the deployment guide for exact backup commands.

## Contact

- Email: debutler2023@gmail.com
- Location: Seoul, South Korea

---

© 2026 De-Butler. All rights reserved.
