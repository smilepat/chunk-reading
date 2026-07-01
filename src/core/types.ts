/** A sense-group chunk — an exact slice of the source text (offsets → 0 drop). */
export interface Chunk {
  text: string; // exact source slice (no leading/trailing whitespace)
  start: number; // inclusive offset into the source text
  end: number; // exclusive
}

/**
 * Produces a Korean 직독직해 gloss for each English chunk, in the same order.
 * Inject your own (any AI/cache/backend) or use the bundled fetch client.
 */
export type GlossFn = (chunks: string[]) => Promise<string[]>;
