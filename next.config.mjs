/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["three", "@react-three/fiber"],
  experimental: {
    // Rewrites barrel imports (e.g. `import { X } from "lucide-react"`) into
    // direct deep imports so dev + prod only compile the icons/components
    // actually used. Big win for cold-start and per-click compile times.
    optimizePackageImports: ["lucide-react", "framer-motion"],
  },
};

export default nextConfig;
