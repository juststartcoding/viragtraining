# Deploying on CyberPanel (OpenLiteSpeed)

This guide replaces the old PHP/CodeIgniter site on **viragtrainingsolutions.com** with this Node.js app.
OpenLiteSpeed keeps handling the domain and SSL, and forwards every request to the Node app running on `127.0.0.1:5081` under PM2.

```
Browser ──https──▶ OpenLiteSpeed (CyberPanel, SSL) ──proxy──▶ Node app :5081 (PM2) ──▶ MongoDB
```

> Replace `viragtrainingsolutions.com` below if your CyberPanel website name differs.
> SSH in as `root` (or a sudo user) for the setup steps.

---

## 1. Back up the old CodeIgniter site (do not skip)

```bash
cd /home/viragtrainingsolutions.com
tar czf ~/old-site-files-$(date +%F).tar.gz public_html
# MySQL: CyberPanel → Databases → phpMyAdmin → Export, or:
mysqldump -u root -p OLD_DB_NAME > ~/old-site-db-$(date +%F).sql
```
Download both files to your computer. Keep the MySQL database until the new site has been live for a few weeks.

## 2. Install Node.js 22 and PM2

```bash
# Ubuntu / Debian
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs git
# AlmaLinux / CentOS:  curl -fsSL https://rpm.nodesource.com/setup_22.x | bash - && dnf install -y nodejs git

node -v        # must be v20.19+ or v22+
npm i -g pm2
```

## 3. Database (MongoDB)

**Option A – MongoDB Atlas (easiest, free tier, automatic backups)**
1. Create a free M0 cluster at https://www.mongodb.com/cloud/atlas
2. Database Access → add a user with a strong password.
3. Network Access → add your **server's public IP**.
4. Copy the connection string, e.g. `mongodb+srv://user:pass@cluster0.xxxx.mongodb.net/virag_training`

**Option B – MongoDB on the same server**: install MongoDB Community 7/8 following the official guide for your OS and keep it bound to `127.0.0.1` (the default). Connection string: `mongodb://127.0.0.1:27017/virag_training`

## 4. Get the code

```bash
cd /home/viragtrainingsolutions.com
git clone https://github.com/juststartcoding/viragtraining.git app
cd app
```
(If the repo is private, use a GitHub personal access token or add the server's SSH key as a deploy key.)

## 5. Pick a free port

Other sites on the same server may already use port 5000. Check that the port you choose prints nothing:
```bash
ss -ltnp | grep ':5081 '
```
This guide uses **5081**. Use the same number in `.env` (`PORT`) and in the vHost `extprocessor` address.

## 5b. Configure `.env`

```bash
cp server/.env.example server/.env
nano server/.env
```
Set at least:
```
PORT=5081
HOST=127.0.0.1
NODE_ENV=production
MONGO_URI=<your connection string from step 3>
JWT_SECRET=<run: openssl rand -hex 48>
CLIENT_URL=https://viragtrainingsolutions.com
ADMIN_EMAIL=<your admin email>
ADMIN_PASSWORD=<a strong password>
# Razorpay (optional, add later)
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
```

## 6. Build and start

```bash
bash deploy/update.sh          # installs, builds the website, starts PM2
npm --prefix server run seed   # optional: starter courses/services (fills empty collections only)
pm2 startup                    # run the command it prints, so the app starts after a reboot
pm2 save
```
Check: `curl http://127.0.0.1:5081/api/health` → `{"ok":true}`

## 7. Point the domain to the Node app (CyberPanel)

CyberPanel → **Websites → List Websites → viragtrainingsolutions.com → Manage**

**a) vHost Conf** – the whole block below must end up at the end of the vHost config. Adding it from the terminal is the most reliable way, because the CyberPanel editor sometimes saves only part of a pasted block:
```bash
F=/usr/local/lsws/conf/vhosts/viragtrainingsolutions.com/vhost.conf
cp "$F" "$F.bak-$(date +%F-%H%M)"
sed -i '/^extprocessor viragnode/,/^}/d; /^extprocessor viragnode/d' "$F"   # remove any old or partial copy
cat >> "$F" <<'CONF'

extprocessor viragnode {
  type                    proxy
  address                 127.0.0.1:5081
  maxConns                200
  pcKeepAliveTimeout      60
  initTimeout             60
  retryTimeout            0
  respBuffer              0
}
CONF
tail -n 12 "$F"     # must show the complete block, ending with }
```

**b) Rewrite Rules** (CyberPanel saves these in `public_html/.htaccess`) – replace everything (the old CodeIgniter rules) with:
```
REWRITEENGINE On
REWRITECOND %{HTTPS} !=on
REWRITERULE ^(.*)$ https://%{HTTP_HOST}/$1 [R=301,L]
REWRITERULE ^(.*)$ HTTP://viragnode/$1 [P,L]
```

**c) SSL** – CyberPanel → **SSL → Manage SSL** → select the domain → *Issue SSL* (skip if already issued).

**d) Restart OpenLiteSpeed** – Server Status → LiteSpeed Status → *Graceful Restart*, or `systemctl restart lsws`.

**e) Clear the old site** (after the new site works, and only with the backup from step 1):
```bash
cd /home/viragtrainingsolutions.com/public_html && mkdir -p ../old-php
find . -mindepth 1 -maxdepth 1 ! -name .htaccess -exec mv {} ../old-php/ \;
```
**Keep `.htaccess`** – it holds the proxy rewrite rules from step 7b. Moving the old PHP files out keeps them (and any config with DB passwords) from being served if the proxy rule is ever removed.

Open https://viragtrainingsolutions.com and https://viragtrainingsolutions.com/admin/login. Change the admin password from **Admin → Account** right away.

## 8. Updating later

```bash
cd /home/viragtrainingsolutions.com/app && bash deploy/update.sh
```

## 9. Backups

- **Uploads (images/PDFs):** `server/uploads/` is not in git. Back it up regularly, e.g. a daily cron:
  `tar czf ~/backups/uploads-$(date +\%F).tar.gz -C /home/viragtrainingsolutions.com/app/server uploads`
- **Database:** Atlas makes backups automatically. For a local MongoDB use `mongodump --db virag_training --out ~/backups/db-$(date +%F)`.

## Troubleshooting

| Problem | Check |
|---|---|
| 503 / "Service unavailable" | `pm2 status`, `pm2 logs virag --lines 50`; check `curl 127.0.0.1:5081/api/health` |
| Old PHP site still shows | Rewrite rules saved? Graceful restart done? Clear browser cache / Cloudflare cache |
| `MongoServerSelectionError` | Atlas: server IP added in Network Access? Correct password in `MONGO_URI`? |
| Images upload but don't show | Folder permissions: `chown -R <site-user>: server/uploads` |
| Too many redirects | If Cloudflare is used, set SSL mode to **Full (strict)** |
| Old Google links show 404 | Old CodeIgniter URLs (e.g. `/index.php/...`) can be 301-redirected with extra `REWRITERULE` lines placed before the proxy rule |
| Log says `Proxy target is not defined ... 'viragnode'` | The `extprocessor viragnode` block is missing from the vHost config. Check with `grep -n -A8 viragnode /usr/local/lsws/conf/vhosts/viragtrainingsolutions.com/vhost.conf`, add it at the top level (not inside another `{ }` block), then Graceful Restart |
| Health check returns something other than `{"ok":true}` | Another app owns that port. Choose a free port (step 5), update `PORT` and the `extprocessor` address, then `pm2 restart virag --update-env` |
