import type { NextConfig } from "next";
const { version } = require('./package.json');

const nextConfig: NextConfig = {
  reactStrictMode: false,
  env: {
    NEXT_PUBLIC_APP_VERSION: version,  // ✅ AGGIUNGI
  },

  // 🔥 Ignora file che cambiano spesso
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.watchOptions = {
        ...config.watchOptions,
        ignored: [
          '**/node_modules/**',
          '**/.next/**',
          '**/temp/**',
          '**/logs/**',
          '**/*.log',
          '**/.git/**',
        ],
      };
    }
    return config;
  },
};

export default nextConfig;
