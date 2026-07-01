"use client";

import type { GlossFn } from "../core/types";

/**
 * Default gloss backend: POST { chunks } to an endpoint that returns { glosses }.
 * Point it at the bundled route (see `chunk-reading/server`) or any compatible
 * endpoint. Pass your own `GlossFn` to the component to bypass this entirely.
 */
export function createFetchGlossFn(endpoint = "/api/gloss"): GlossFn {
  return async (chunks) => {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chunks }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error ?? `gloss request failed (${res.status})`);
    return (data.glosses ?? []) as string[];
  };
}
