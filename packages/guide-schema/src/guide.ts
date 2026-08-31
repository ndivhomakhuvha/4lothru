import { z } from "zod";
import { GuideStepSchema } from "./steps.js";

/**
 * `.passthrough()` keeps unknown top-level keys (e.g. future `meta` blocks used by
 * a browser recorder) so older guides stay forward-compatible without a schema bump.
 */
export const GuideSchema = z
  .object({
    id: z.string().min(1),
    title: z.string().min(1),
    application: z.string().min(1),
    release: z.string().min(1),
    start: z.object({ url: z.string().min(1) }).strict(),
    steps: z.array(GuideStepSchema).min(1, "A guide must contain at least one step."),
  })
  .passthrough();

export type Guide = z.infer<typeof GuideSchema>;
