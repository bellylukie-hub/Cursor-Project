/**
 * PM2 config — run from repo root:
 *   pm2 start ecosystem.config.cjs
 *   pm2 save
 *   pm2 startup
 */
module.exports = {
  apps: [
    {
      name: 'truckcontrol',
      script: 'pm2-start.sh',
      interpreter: 'bash',
      cwd: __dirname,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};
