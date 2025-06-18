import { z } from 'zod';
import { workflowSchema, nodeSchema, edgeSchema } from './schemas';
export type WorkflowInput = z.input<typeof workflowSchema>;
export type WorkflowOutput = z.output<typeof workflowSchema>;
export type NodeInput = z.input<typeof nodeSchema>;
export type NodeOutput = z.output<typeof nodeSchema>;
export type EdgeInput = z.input<typeof edgeSchema>;
export type EdgeOutput = z.output<typeof edgeSchema>;
export interface APIResponse<T> {
    data?: T;
    error?: string;
    success: boolean;
}
export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    pageSize: number;
    hasNext: boolean;
    hasPrev: boolean;
}
