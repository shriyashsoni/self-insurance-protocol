export const VERCEL_CONFIG = {
  // Environment variables required for deployment
  requiredEnvVars: [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "CHAINLINK_API_KEY",
    "NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL",
  ],

  // Build configuration
  build: {
    env: {
      NEXT_TELEMETRY_DISABLED: "1",
    },
  },

  // Function configuration for API routes
  functions: {
    "app/api/oracle-monitor/route.ts": {
      maxDuration: 30,
    },
    "app/api/policies/user/route.ts": {
      maxDuration: 10,
    },
    "app/api/claims/user/route.ts": {
      maxDuration: 10,
    },
  },

  // Headers for security
  headers: [
    {
      source: "/api/(.*)",
      headers: [
        {
          key: "Access-Control-Allow-Origin",
          value: "*",
        },
        {
          key: "Access-Control-Allow-Methods",
          value: "GET, POST, PUT, DELETE, OPTIONS",
        },
        {
          key: "Access-Control-Allow-Headers",
          value: "Content-Type, Authorization",
        },
      ],
    },
  ],
}

export function validateDeploymentEnv(): { valid: boolean; missing: string[] } {
  const missing: string[] = []

  for (const envVar of VERCEL_CONFIG.requiredEnvVars) {
    if (!process.env[envVar]) {
      missing.push(envVar)
    }
  }

  return {
    valid: missing.length === 0,
    missing,
  }
}
