import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ hostname: "res.cloudinary.com", protocol: "https" }],
  },
  reactStrictMode: true,
};

export default nextConfig;
