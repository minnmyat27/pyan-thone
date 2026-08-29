import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: { remotePatterns: [{ protocol: "https", hostname: "mnppadqnjnneeziebgcl.supabase.co", pathname: "/storage/v1/object/public/listing-images/**" }] },
  async redirects() {
    return [
      { source: "/buyer/login", destination: "/login", permanent: false },
      { source: "/buyer/signup", destination: "/register", permanent: false },
      { source: "/seller/login", destination: "/login", permanent: false },
      { source: "/seller/signup", destination: "/register", permanent: false },
      { source: "/seller/dashboard", destination: "/seller", permanent: false },
      { source: "/buyer/chat", destination: "/buyer/messages", permanent: false },
      { source: "/buyer/delivery", destination: "/buyer/orders", permanent: false },
      { source: "/buyer/product/:id", destination: "/listings/:id", permanent: false },
      { source: "/buyer/seller/:id", destination: "/sellers/:id", permanent: false },
    ];
  },
};
export default nextConfig;
