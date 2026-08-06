/** A sense-group chunk — an exact slice of the source text (offsets → 0 drop). */
export interface Chunk {
  text: string; // exact source slice (no leading/trailing whitespace)
  start: number; // inclusive offset into the source text
  end: number; // exclusive
}

/**
 * What a gloss backend returns for the given chunks, in the same order:
 * - `string[]` — 직독직해 glosses only (legacy shape, still fully supported)
 * - `{ glosses, roles? }` — glosses + optional 추임새 role prompts (누가/어디로/왜…)
 */
export type GlossResult = string[] | { glosses: string[]; roles?: string[] };

/**
 * Produces a Korean 직독직해 gloss (and optionally a 추임새 role prompt) for each
 * English chunk. Inject your own (any AI/cache/backend) or use the bundled
 * fetch client. Returning a plain `string[]` is always accepted.
 */
export type GlossFn = (chunks: string[]) => Promise<GlossResult>;
