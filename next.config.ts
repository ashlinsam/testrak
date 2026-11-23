import type { NextConfig } from "next";

/**
 * Builds to a plain static folder (`out/`), so it can be hosted anywhere:
 * Render (static site), Vercel, Netlify, GitHub Pages…
 */
const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "export",
  images: { unoptimized: true },
  // Only used for hosting the build inside a sub-folder (RELATIVE_ASSETS=1 npm run build).
  ...(process.env.RELATIVE_ASSETS ? { assetPrefix: "." } : {}),
};

export default nextConfig;
