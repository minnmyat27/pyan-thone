import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: { remotePatterns: [{ protocol: "https", hostname: "mnppadqnjnneeziebgcl.supabase.co", pathname: "/storage/v1/object/public/listing-images/**" }] },
};
export default nextConfig;
