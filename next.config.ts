import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lets the admin screens return a real 403 page (app/forbidden.tsx) with forbidden().
  experimental: {
    authInterrupts: true,
  },
};

export default nextConfig;
