/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Don't keep dynamic pages (leads, lead detail) in the client-side router
    // cache. Ensures navigating to a lead always refetches the latest data, so
    // notes/updates added by other users (e.g. a member's note) show up for the
    // admin without a hard reload.
    staleTimes: {
      dynamic: 0,
    },
  },
};

export default nextConfig;
