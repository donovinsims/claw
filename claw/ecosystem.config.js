module.exports = {
  apps: [
    {
      name: "claw-bridge",
      script: "npm",
      args: "run dev",
      cwd: "/Users/forex/openclaw-workspace/claw/bridge",
      env_file: "/Users/forex/.openclaw/mission-control/bridge.env",
      restart_delay: 5000,
      max_restarts: 10,
      autorestart: true,
      out_file: "/tmp/claw-bridge.out.log",
      error_file: "/tmp/claw-bridge.err.log",
    },
    {
      name: "claw-dashboard",
      script: "npm",
      args: "run dev",
      cwd: "/Users/forex/openclaw-workspace/claw",
      restart_delay: 5000,
      autorestart: true,
      out_file: "/tmp/claw-dashboard.out.log",
      error_file: "/tmp/claw-dashboard.err.log",
    },
    {
      name: "openclaw-gateway",
      script: "/Users/forex/.nvm/versions/node/v24.12.0/lib/node_modules/openclaw/dist/index.js",
      args: "gateway --port 18789",
      autorestart: true,
      restart_delay: 5000,
      out_file: "/Users/forex/.openclaw/logs/gateway.log",
      error_file: "/Users/forex/.openclaw/logs/gateway.err.log",
      env: {
        HOME: "/Users/forex",
        PATH: "/Users/forex/.local/share/pnpm:/Users/forex/.bun/bin:/Users/forex/.nvm:/Users/forex/.local/bin:/Users/forex/.npm-global/bin:/Users/forex/bin:/Users/forex/.volta/bin:/Users/forex/.asdf/shims:/Users/forex/Library/Application Support/fnm/aliases/default/bin:/Users/forex/.fnm/aliases/default/bin:/Users/forex/Library/pnpm:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin",
        OPENCLAW_GATEWAY_PORT: "18789",
        OPENCLAW_GATEWAY_TOKEN: "6b6feb4c6d8153f9c48fc6521bdd82917347975fcf3dc779"
      }
    }
  ],
};
