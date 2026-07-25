module.exports = {
  apps: [
    {
      name: "medcampus-server",
      script: "./apps/server/dist/index.js",
      instances: 2,
      exec_mode: "cluster",
      watch: false,
      env_production: {
        NODE_ENV: "production",
        PORT: 5000,
      },
    },
    {
      name: "medcampus-client",
      script: "node_modules/.bin/next",
      args: "start",
      cwd: "./apps/client",
      instances: 1,
      watch: false,
      env_production: {
        NODE_ENV: "production",
        PORT: 4000, // Port 3000 dipakai web-sekolah
      },
    },
  ],
};
