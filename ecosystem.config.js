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
    }
  ],
};
