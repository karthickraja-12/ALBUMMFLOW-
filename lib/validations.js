import { z } from "zod";

export const eventSchema = z.object({
  name: z.string().min(1, "Event name is required").max(100, "Event name must be 100 characters or less"),
  max_selections: z.coerce.number().int().min(1).max(1000).default(50),
});

export const presignedUrlSchema = z.object({
  filename: z.string().min(1, "Filename is required").max(255),
  contentType: z.string().min(1, "Content type is required"),
  eventId: z.string().min(1, "Event ID is required"),
});
