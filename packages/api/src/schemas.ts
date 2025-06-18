import { z } from 'zod';

export const nodeSchema = z.object({
  id: z.string(),
  type: z.string(),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }),
  data: z.object({
    label: z.string(),
    inputs: z.array(z.string()).optional(),
    outputs: z.array(z.string()).optional(),
    config: z.record(z.unknown()).optional(),
  }),
});

export const edgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  sourceHandle: z.string().optional(),
  targetHandle: z.string().optional(),
  animated: z.boolean().optional(),
  data: z
    .object({
      streamActive: z.boolean().optional(),
      messageCount: z.number().optional(),
    })
    .optional(),
});

export const workflowSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  nodes: z.array(nodeSchema),
  edges: z.array(edgeSchema),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});
