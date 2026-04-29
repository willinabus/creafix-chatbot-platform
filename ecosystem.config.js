module.exports = {
  apps: [
    {
      name: "chatbot-platform",
      script: "node_modules/.bin/next",
      args: "dev -p 3000",
      cwd: "/Users/amadeomiranda/Documents/CODEX WEBAPPS/PLATEFORME CHATBOTS CREAFIX/chatbot-platform",
      env: {
        NODE_ENV: "development",
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
    },
  ],
};
