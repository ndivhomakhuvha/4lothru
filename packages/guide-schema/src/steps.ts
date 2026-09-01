import { z } from "zod";
import { TargetSchema } from "./target.js";

const id = z.string().min(1);
const instruction = z.string().min(1);
const autoAdvance = z.boolean().optional();

export const ClickStepSchema = z
  .object({ id, action: z.literal("click"), target: TargetSchema, instruction, autoAdvance })
  .strict();

export const InputStepSchema = z
  .object({
    id,
    action: z.literal("input"),
    target: TargetSchema,
    value: z.string(),
    instruction,
    autoAdvance,
  })
  .strict();

export const SelectStepSchema = z
  .object({
    id,
    action: z.literal("select"),
    target: TargetSchema,
    value: z.string(),
    instruction,
    autoAdvance,
  })
  .strict();

export const VerifyStepSchema = z
  .object({ id, action: z.literal("verify"), target: TargetSchema, instruction })
  .strict();

export const NavigateStepSchema = z
  .object({ id, action: z.literal("navigate"), url: z.string().min(1), instruction })
  .strict();

export const WaitStepSchema = z
  .object({
    id,
    action: z.literal("wait"),
    target: TargetSchema.optional(),
    timeoutMs: z.number().int().positive().optional(),
    instruction,
  })
  .strict();

/** Discriminated union keyed on `action`, so each step carries only the fields it needs. */
export const GuideStepSchema = z.discriminatedUnion("action", [
  ClickStepSchema,
  InputStepSchema,
  SelectStepSchema,
  VerifyStepSchema,
  NavigateStepSchema,
  WaitStepSchema,
]);

export type ClickStep = z.infer<typeof ClickStepSchema>;
export type InputStep = z.infer<typeof InputStepSchema>;
export type SelectStep = z.infer<typeof SelectStepSchema>;
export type VerifyStep = z.infer<typeof VerifyStepSchema>;
export type NavigateStep = z.infer<typeof NavigateStepSchema>;
export type WaitStep = z.infer<typeof WaitStepSchema>;
export type GuideStep = z.infer<typeof GuideStepSchema>;
export type GuideActionType = GuideStep["action"];

const placementFields = {
  before: z.string().min(1).optional(),
  after: z.string().min(1).optional(),
};

/** A source-only step that is inserted relative to a step inherited from a base guide. */
export const AuthorGuideStepSchema = z.discriminatedUnion("action", [
  ClickStepSchema.extend(placementFields),
  InputStepSchema.extend(placementFields),
  SelectStepSchema.extend(placementFields),
  VerifyStepSchema.extend(placementFields),
  NavigateStepSchema.extend(placementFields),
  WaitStepSchema.extend(placementFields),
]);

export type AuthorGuideStep = z.infer<typeof AuthorGuideStepSchema>;
