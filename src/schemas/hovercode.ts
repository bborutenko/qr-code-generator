import { z } from "zod";

export const hovercodeCreateCodeSchema = z.object({
  id: z.string().uuid(),
  qr_data: z.string(),
  qr_type: z.string(),
  display_name: z.string().nullable(),
  shortlink_url: z.string().url().nullable(),
  dynamic: z.boolean(),
  frame: z.string().nullable(),
  logo: z.string().nullable(),
  primary_color: z.string(),
  background_color: z.string().nullable(),
  pattern: z.string(),
  text: z.string().nullable(),
  has_border: z.boolean(),
  svg: z.string(),
  svg_file: z.string().nullable(),
  png: z.string().nullable(),
  created: z.string().datetime(),
});

export const hovercodeDisplayCodeSchema = z.object({
  id: z.string().uuid(),
  link: z.string().url(),
  display_name: z.string().nullable(),
  square: z.boolean(),
  logo: z.string().url().nullable(),
  primary_color: z.string(),
  svg: z.string(),
  svg_file: z.string().url().nullable(),
  png: z.string().url().nullable(),
  created: z.string().datetime(),
});

export const hovercodeListItemSchema = z.object({
  id: z.string().uuid(),
  qr_data: z.string(),
  qr_type: z.string(),
  display_name: z.string().nullable(),
  shortlink_url: z.string().url().nullable(),
  dynamic: z.boolean(),
  created: z.string().datetime(),
});

export const hovercodePaginatedResponseSchema = z.object({
  count: z.number().int().nonnegative(),
  next: z.string().url().nullable(),
  previous: z.string().url().nullable(),
  results: z.array(hovercodeListItemSchema),
});

export const hovercodeResultsWithMessageSchema = z.object({
  message: z.string(),
  results: z.array(hovercodeListItemSchema),
});

export const hovercodeAnalyticsItemSchema = z.object({
  qr_code_id: z.string(),
  time_utc: z.string(),
  time_timezone_aware: z.string(),
  location: z.string(),
  device: z.string(),
  scanner_id: z.string(),
  id: z.string().uuid(),
});

export const hovercodePaginatedAnalyticsResponseSchema = z.object({
  count: z.number().int().nonnegative(),
  next: z.string().url().nullable(),
  previous: z.string().url().nullable(),
  results: z.array(hovercodeAnalyticsItemSchema),
});

export type HovercodeResultsWithMessage = z.infer<typeof hovercodeResultsWithMessageSchema>;

export type HovercodePaginatedResponse = z.infer<typeof hovercodePaginatedResponseSchema>;
export type HovercodePaginatedAnalyticsResponse = z.infer<typeof hovercodePaginatedAnalyticsResponseSchema>;
export type HovercodeCreateCode = z.infer<typeof hovercodeCreateCodeSchema>;
export type HovercodeDisplayCode = z.infer<typeof hovercodeDisplayCodeSchema>;