/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Trim the JS shipped to the browser for these heavy deps.
  experimental: {
    optimizePackageImports: ["zod"],
    // Keep visited pages warm in the client router cache so back/forward and
    // revisits are instant. Freshness after a mutation is handled by optimistic
    // UI + revalidatePath + router.refresh, so a short cache is safe here.
    staleTimes: {
      dynamic: 30,
      static: 180,
    },
  },
  compiler: {
    // Drop console.* in production builds.
    removeConsole: process.env.NODE_ENV === "production" ? { exclude: ["error"] } : false,
  },
};

export default nextConfig;
