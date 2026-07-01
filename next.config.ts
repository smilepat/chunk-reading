import type { NextConfig } from "next";

// The demo app under `app/` consumes the library from `src/` via the
// `chunk-reading*` tsconfig path aliases — exactly like a real consumer would
// import the published package, but resolving to local source.
const nextConfig: NextConfig = {};

export default nextConfig;
