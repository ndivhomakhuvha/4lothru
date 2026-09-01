import { z } from "zod";
import { AuthorGuideStepSchema, GuideStepSchema } from "./steps.js";

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

/**
 * Authoring guides may extend another guide from the same release. Extension steps
 * are additive and must declare one stable insertion anchor.
 */
export const AuthorGuideSchema = z
  .object({
    id: z.string().min(1),
    title: z.string().min(1),
    application: z.string().min(1),
    release: z.string().min(1),
    start: z.object({ url: z.string().min(1) }).strict(),
    extends: z.string().min(1).optional(),
    steps: z.array(AuthorGuideStepSchema).min(1, "A guide must contain at least one step."),
  })
  .passthrough()
  .superRefine((guide, context) => {
    guide.steps.forEach((step, index) => {
      const hasBefore = step.before !== undefined;
      const hasAfter = step.after !== undefined;

      if (hasBefore && hasAfter) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["steps", index],
          message: "An extension step must use either before or after, not both.",
        });
      }

      if (guide.extends && !hasBefore && !hasAfter) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["steps", index],
          message: "An extension step must specify before or after.",
        });
      }

      if (!guide.extends && (hasBefore || hasAfter)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["steps", index],
          message: "before and after are only valid on a guide with extends.",
        });
      }
    });
  });

export type AuthorGuide = z.infer<typeof AuthorGuideSchema>;
