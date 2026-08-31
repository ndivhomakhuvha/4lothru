import { z } from "zod";

/**
 * Priority order used by the SDK's target resolver, highest priority first.
 * A single target may carry more than one hint (e.g. a `testId` with a `selector`
 * fallback); the resolver tries them in this order until one matches.
 */
export const TARGET_STRATEGY_ORDER = [
  "testId",
  "role",
  "label",
  "text",
  "selector",
] as const;

export const TargetSchema = z
  .object({
    testId: z.string().min(1).optional(),
    role: z.string().min(1).optional(),
    name: z.string().min(1).optional(),
    label: z.string().min(1).optional(),
    text: z.string().min(1).optional(),
    selector: z.string().min(1).optional(),
  })
  .strict()
  .superRefine((value, ctx) => {
    const hasStrategy =
      !!value.testId || (!!value.role && !!value.name) || !!value.label || !!value.text || !!value.selector;
    if (!hasStrategy) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Target must specify at least one of testId, role+name, label, text, or selector.",
      });
    }
    if (value.role && !value.name) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["name"], message: "A role target also requires a name." });
    }
    if (value.name && !value.role) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["role"], message: "A name target also requires a role." });
    }
  });

export type Target = z.infer<typeof TargetSchema>;
