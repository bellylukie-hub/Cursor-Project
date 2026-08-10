# TruckControl Documentation

**Package version:** v2.5.4-full-production

Welcome to the TruckControl documentation set included in the production ZIP.

---

## Start here

| Document | Who it's for | Description |
|----------|--------------|-------------|
| [../START-HERE.txt](../START-HERE.txt) | Everyone | One-page quick start after extracting the ZIP |
| **[COMPLETE-MANUAL.md](COMPLETE-MANUAL.md)** | **Everyone** | **Full book with illustrations — step-by-step app use, chatbot, bulk actions, admin** |
| [INSTALLATION.md](INSTALLATION.md) | IT / server admins | **Master install guide** — Docker, WAMP, Linux, Windows, PM2, domain, HTTPS |
| [USER-GUIDE.md](USER-GUIDE.md) | Operations users | Shorter operating directive — menus, workflows, uploads |
| [../PRODUCTION.md](../PRODUCTION.md) | DevOps | Environment variables, PM2, security checklist, API auth |
| [../DOWNLOAD.md](../DOWNLOAD.md) | Everyone | Download, build ZIP, deploy on domain |
| [../README.md](../README.md) | Developers | Project overview and quick start from source |

---

## Illustrations (`docs/images/`)

| Image | Topic |
|-------|--------|
| `app-overview.svg` | All major modules |
| `screen-layout.svg` | Sidebar, top bar, content, help |
| `bulk-actions-toolbar.svg` | **Checkbox bulk actions toolbar** |
| `soft-delete-rbac.svg` | **Delete / restore permissions** |
| `domain-deployment.svg` | **HTTPS domain deployment** |
| `nb-workflow.svg` / `sb-workflow.svg` | Operations workflows |
| `fms-workflow.svg` | Orders → trips → fleet |
| `help-assistant.svg` | Chatbot usage |
| `internal-comm-email.svg` | **Internal email delivery & notifications** |
| `internal-comm-chat.svg` | **Chat tab & contact picker** |
| `admin-setup-order.svg` | Recommended admin setup order |

---

## Installation by platform

| Platform | Primary guide | Section |
|----------|---------------|---------|
| **Docker (any OS)** | [INSTALLATION.md §4](INSTALLATION.md#4-docker--all-platforms) | Recommended |
| **Public domain + HTTPS** | [INSTALLATION.md §12](INSTALLATION.md#12-nginx--caddy--https) | Caddy / nginx |
| **Windows + WAMP** | [INSTALLATION.md §5](INSTALLATION.md#5-windows--wamp--docker) | Also [INSTALL-WAMP-DOCKER.md](../INSTALL-WAMP-DOCKER.md) |
| **Linux server** | [INSTALLATION.md §6–7](INSTALLATION.md#6-linux-server-docker) | Also [INSTALL-SERVER.md](../INSTALL-SERVER.md) |
| **PM2 (24/7)** | [INSTALLATION.md §10](INSTALLATION.md#10-pm2--run-247) | Also [PRODUCTION.md](../PRODUCTION.md) |

---

## User topics

| Topic | Location |
|-------|----------|
| Bulk actions toolbar | [COMPLETE-MANUAL §2.2](COMPLETE-MANUAL.md#bulk-actions-checkbox-toolbar) |
| Soft delete & restore | [COMPLETE-MANUAL §5.5](COMPLETE-MANUAL.md#55-soft-delete-permissions) |
| Domain deployment | [COMPLETE-MANUAL §5.4](COMPLETE-MANUAL.md#54-deploy-on-a-public-domain-https) |
| NB / SB / Border / POD | [COMPLETE-MANUAL §2.2–2.5](COMPLETE-MANUAL.md#22-nb-operations-northbound) |
| Help assistant (chatbot) | [COMPLETE-MANUAL Part III](COMPLETE-MANUAL.md#part-iii--help-assistant-chatbot) |
| Internal email & chat | [COMPLETE-MANUAL §2.9](COMPLETE-MANUAL.md#29-internal-communication) |
| Admin setup | [COMPLETE-MANUAL Part IV](COMPLETE-MANUAL.md#part-iv--administrator-guide-step-by-step) |

---

## Build a new ZIP (from source)

```bash
chmod +x scripts/build-production-zip.sh
./scripts/build-production-zip.sh v2.5.4-full-production
```

Output: `dist/TruckControl-Production-v2.5.4-full-production.zip`

---

## Support checklist for administrators

1. Set strong `JWT_SECRET` in `.env`
2. Set `RUN_SEED=false` after first deploy
3. Change default user passwords
4. Put HTTPS (Caddy/nginx) in front for internet-facing domain
5. Set `CORS_ORIGIN` to your HTTPS domain
6. Back up `truckcontrol.db` and `uploads/` regularly
