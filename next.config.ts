import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  
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
