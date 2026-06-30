# Free VM Docker Deployment

This project runs as a Vite-built React SPA plus an Express API. The API owns SQLite data and uploaded files, so production must keep `/data` and `/uploads` outside the container image.

## Stack

- Oracle Cloud Always Free VM or another free Linux VM
- Docker Compose
- Caddy on port 80
- Node 22 Express API
- SQLite database in the `db_data` Docker volume
- Uploaded files in the `upload_data` Docker volume

## First Deploy Without a Domain

1. Create an Oracle Cloud Always Free VM, preferably Ubuntu.
2. In the Oracle Cloud network security list or NSG, allow inbound TCP `80` from `0.0.0.0/0`.
3. Open the VM firewall if enabled:

   ```sh
   sudo ufw allow 80/tcp || true
   sudo firewall-cmd --permanent --add-service=http && sudo firewall-cmd --reload || true
   ```

4. Install Docker and the Compose plugin:

   ```sh
   sudo apt-get update
   sudo apt-get install -y docker.io docker-compose-plugin git
   sudo usermod -aG docker "$USER"
   ```

5. Log out and back in so the Docker group is applied.
6. Clone the repository and enter it:

   ```sh
   git clone <repository-url>
   cd de-butler-webpage
   ```

7. Create the production environment file:

   ```sh
   cp .env.production.example .env.production
   ```

8. Edit `.env.production` and replace:

   - `ADMIN_PASSWORD`
   - `ADMIN_TOKEN_SECRET` with at least 32 random characters

9. Build and start the stack:

   ```sh
   docker compose up -d --build
   ```

10. Check the deployment:

    ```sh
    docker compose ps
    docker compose logs --tail=80 app
    docker compose logs --tail=80 web
    ```

11. Open `http://<public-ip>/` and `http://<public-ip>/api/health`.

## Updates

Run this from the repository directory on the VM:

```sh
git pull
docker compose up -d --build
docker image prune -f
```

## Backups

Create local backup files under `backups/`:

```sh
mkdir -p backups
docker compose exec app node -e "const Database=require('better-sqlite3'); const db=new Database('/data/de-butler.sqlite',{readonly:true}); db.backup('/tmp/de-butler-backup.sqlite').then(()=>db.close())"
docker compose cp app:/tmp/de-butler-backup.sqlite "./backups/de-butler-$(date +%Y%m%d%H%M%S).sqlite"
docker compose exec app tar -czf /tmp/uploads-backup.tgz -C /uploads .
docker compose cp app:/tmp/uploads-backup.tgz "./backups/uploads-$(date +%Y%m%d%H%M%S).tgz"
```

Copy `backups/` somewhere outside the VM if the data matters.

## Later: Add a Domain and HTTPS

After a domain or DDNS hostname points to the VM public IP, change the first line of `Caddyfile` from `:80 {` to:

```caddyfile
your-domain.example {
```

Then publish HTTPS and persist Caddy state by updating `compose.yaml`:

```yaml
web:
  ports:
    - "80:80"
    - "443:443"
  volumes:
    - caddy_data:/data
    - caddy_config:/config

volumes:
  caddy_data:
  caddy_config:
```

Run:

```sh
docker compose up -d --build
```
