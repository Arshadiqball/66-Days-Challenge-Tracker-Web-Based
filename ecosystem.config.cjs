// PM2 process definitions for the 66-day challenge tracker.
//
// Frontend runs `vite preview` (serves the built `dist/` folder), NOT the
// dev server. The dev server is for local development only and must never
// be exposed in production: it is single-threaded, transpiles on every
// request, and exposes source files unless explicitly blocked.

module.exports = {
  apps: [
    {
      name: 'dashboard-backend',
      cwd: __dirname,
      script: 'backend/server.js',
      interpreter: 'node',
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'dashboard-frontend',
      cwd: __dirname,
      script: 'npm',
      args: 'run start',
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        BACKEND_PROXY_TARGET: 'http://127.0.0.1:8000',
      },
    },
  ],
};
