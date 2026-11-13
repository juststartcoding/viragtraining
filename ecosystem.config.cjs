// PM2 process file – keeps the Node server running and restarts it on crash/reboot.
//   pm2 start ecosystem.config.cjs     (first time)
//   pm2 reload virag                   (after updates)
const path = require('path');

module.exports = {
  apps: [
    {
      name: 'virag',
      cwd: path.join(__dirname, 'server'),
      script: 'src/index.js',
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '400M',
      env: { NODE_ENV: 'production' },
      out_file: path.join(__dirname, 'logs/out.log'),
      error_file: path.join(__dirname, 'logs/error.log'),
      time: true,
    },
  ],
};
