# TruckControl Documentation

**Package version:** v1.2.0-production

Welcome to the TruckControl documentation set included in the production ZIP.

---

## Start here

| Document | Who it's for | Description |
|----------|--------------|-------------|
| [../START-HERE.txt](../START-HERE.txt) | Everyone | One-page quick start after extracting the ZIP |
| [INSTALLATION.md](INSTALLATION.md) | IT / server admins | **Master install guide** — Docker, WAMP, Linux, Windows, PM2, Apache, nginx |
| [USER-GUIDE.md](USER-GUIDE.md) | Operations users | **Full user directive** — menus, workflows, uploads, reports, admin |
| [../PRODUCTION.md](../PRODUCTION.md) | DevOps | Environment variables, PM2, security checklist, API auth |
| [../README.md](../README.md) | Developers | Project overview and quick start from source |

---

## Installation by platform

| Platform | Primary guide | Section |
|----------|---------------|---------|
| **Docker (any OS)** | [INSTALLATION.md §4](INSTALLATION.md#4-docker--all-platforms) | Recommended for all environments |
| **Windows + WAMP** | [INSTALLATION.md §5](INSTALLATION.md#5-windows--wamp--docker) | Also [INSTALL-WAMP-DOCKER.md](../INSTALL-WAMP-DOCKER.md) |
| **Linux server** | [INSTALLATION.md §6–7](INSTALLATION.md#6-linux-server-docker) | Also [INSTALL-SERVER.md](../INSTALL-SERVER.md) |
| **Windows manual** | [INSTALLATION.md §8](INSTALLATION.md#8-windows-manual-no-docker) | Node.js without Docker |
| **macOS** | [INSTALLATION.md §9](INSTALLATION.md#9-macos) | Docker or Homebrew Node |
| **PM2 (24/7)** | [INSTALLATION.md §10](INSTALLATION.md#10-pm2--run-247) | Also [PRODUCTION.md](../PRODUCTION.md) |
| **XAMPP / LAMP / Apache** | [INSTALLATION.md §11](INSTALLATION.md#11-xampp--lamp--apache-reverse-proxy) | Reverse proxy only |
| **HTTPS (nginx / Caddy)** | [INSTALLATION.md §12](INSTALLATION.md#12-nginx--caddy--https) | Production TLS |

---

## User topics

| Topic | Location |
|-------|----------|
| Sign in and roles | [USER-GUIDE §1–2](USER-GUIDE.md#1-getting-started) |
| NB / SB / Border / POD workflows | [USER-GUIDE §5](USER-GUIDE.md#5-operations) |
| Daily operating checklist | [USER-GUIDE §10](USER-GUIDE.md#10-daily-operating-procedures) |
| CSV uploads and templates | [USER-GUIDE §12](USER-GUIDE.md#12-uploads-and-templates) |
| Custom and cross-menu reports | [USER-GUIDE §14](USER-GUIDE.md#14-reports) |
| Admin (users, KPI, permissions) | [USER-GUIDE §9](USER-GUIDE.md#9-administration) |

---

## Sample files

Located in `samples/` at the package root:

- `NB_Live_Template.csv` — northbound live file template
- `SB_Live_Template.csv` — southbound live file template

---

## Build a new ZIP (from source)

```bash
chmod +x scripts/build-production-zip.sh
./scripts/build-production-zip.sh v1.2.0-production
```

Output: `dist/TruckControl-Production-v1.2.0-production.zip`

---

## Support checklist for administrators

1. Set strong `JWT_SECRET` in `.env`
2. Set `RUN_SEED=false` after first deploy
3. Change default user passwords
4. Open firewall port 3001 (or your `PORT`)
5. Back up `truckcontrol.db` and `uploads/` regularly
6. Put HTTPS in front for internet-facing deployments
