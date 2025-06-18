import { z } from 'zod';
export declare const nodeSchema: z.ZodObject<{
    id: z.ZodString;
    type: z.ZodString;
    position: z.ZodObject<{
        x: z.ZodNumber;
        y: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        x: number;
        y: number;
    }, {
        x: number;
        y: number;
    }>;
    data: z.ZodObject<{
        label: z.ZodString;
        inputs: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        outputs: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        config: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, "strip", z.ZodTypeAny, {
        label: string;
        inputs?: string[] | undefined;
        outputs?: string[] | undefined;
        config?: Record<string, unknown> | undefined;
    }, {
        label: string;
        inputs?: string[] | undefined;
        outputs?: string[] | undefined;
        config?: Record<string, unknown> | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    id: string;
    type: string;
    position: {
        x: number;
        y: number;
    };
    data: {
        label: string;
        inputs?: string[] | undefined;
        outputs?: string[] | undefined;
        config?: Record<string, unknown> | undefined;
    };
}, {
    id: string;
    type: string;
    position: {
        x: number;
        y: number;
    };
    data: {
        label: string;
        inputs?: string[] | undefined;
        outputs?: string[] | undefined;
        config?: Record<string, unknown> | undefined;
    };
}>;
export declare const edgeSchema: z.ZodObject<{
    id: z.ZodString;
    source: z.ZodString;
    target: z.ZodString;
    sourceHandle: z.ZodOptional<z.ZodString>;
    targetHandle: z.ZodOptional<z.ZodString>;
    animated: z.ZodOptional<z.ZodBoolean>;
    data: z.ZodOptional<z.ZodObject<{
        streamActive: z.ZodOptional<z.ZodBoolean>;
        messageCount: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        streamActive?: boolean | undefined;
        messageCount?: number | undefined;
    }, {
        streamActive?: boolean | undefined;
        messageCount?: number | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    id: string;
    source: string;
    target: string;
    data?: {
        streamActive?: boolean | undefined;
        messageCount?: number | undefined;
    } | undefined;
    sourceHandle?: string | undefined;
    targetHandle?: string | undefined;
    animated?: boolean | undefined;
}, {
    id: string;
    source: string;
    target: string;
    data?: {
        streamActive?: boolean | undefined;
        messageCount?: number | undefined;
    } | undefined;
    sourceHandle?: string | undefined;
    targetHandle?: string | undefined;
    animated?: boolean | undefined;
}>;
export declare const workflowSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    nodes: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        type: z.ZodString;
        position: z.ZodObject<{
            x: z.ZodNumber;
            y: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            x: number;
            y: number;
        }, {
            x: number;
            y: number;
        }>;
        data: z.ZodObject<{
            label: z.ZodString;
            inputs: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            outputs: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            config: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        }, "strip", z.ZodTypeAny, {
            label: string;
            inputs?: string[] | undefined;
            outputs?: string[] | undefined;
            config?: Record<string, unknown> | undefined;
        }, {
            label: string;
            inputs?: string[] | undefined;
            outputs?: string[] | undefined;
            config?: Record<string, unknown> | undefined;
        }>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        type: string;
        position: {
            x: number;
            y: number;
        };
        data: {
            label: string;
            inputs?: string[] | undefined;
            outputs?: string[] | undefined;
            config?: Record<string, unknown> | undefined;
        };
    }, {
        id: string;
        type: string;
        position: {
            x: number;
            y: number;
        };
        data: {
            label: string;
            inputs?: string[] | undefined;
            outputs?: string[] | undefined;
            config?: Record<string, unknown> | undefined;
        };
    }>, "many">;
    edges: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        source: z.ZodString;
        target: z.ZodString;
        sourceHandle: z.ZodOptional<z.ZodString>;
        targetHandle: z.ZodOptional<z.ZodString>;
        animated: z.ZodOptional<z.ZodBoolean>;
        data: z.ZodOptional<z.ZodObject<{
            streamActive: z.ZodOptional<z.ZodBoolean>;
            messageCount: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            streamActive?: boolean | undefined;
            messageCount?: number | undefined;
        }, {
            streamActive?: boolean | undefined;
            messageCount?: number | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        source: string;
        target: string;
        data?: {
            streamActive?: boolean | undefined;
            messageCount?: number | undefined;
        } | undefined;
        sourceHandle?: string | undefined;
        targetHandle?: string | undefined;
        animated?: boolean | undefined;
    }, {
        id: string;
        source: string;
        target: string;
        data?: {
            streamActive?: boolean | undefined;
            messageCount?: number | undefined;
        } | undefined;
        sourceHandle?: string | undefined;
        targetHandle?: string | undefined;
        animated?: boolean | undefined;
    }>, "many">;
    createdAt: z.ZodOptional<z.ZodDate>;
    updatedAt: z.ZodOptional<z.ZodDate>;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    nodes: {
        id: string;
        type: string;
        position: {
            x: number;
            y: number;
        };
        data: {
            label: string;
            inputs?: string[] | undefined;
            outputs?: string[] | undefined;
            config?: Record<string, unknown> | undefined;
        };
    }[];
    edges: {
        id: string;
        source: string;
        target: string;
        data?: {
            streamActive?: boolean | undefined;
            messageCount?: number | undefined;
        } | undefined;
        sourceHandle?: string | undefined;
        targetHandle?: string | undefined;
        animated?: boolean | undefined;
    }[];
    description?: string | undefined;
    createdAt?: Date | undefined;
    updatedAt?: Date | undefined;
}, {
    id: string;
    name: string;
    nodes: {
        id: string;
        type: string;
        position: {
            x: number;
            y: number;
        };
        data: {
            label: string;
            inputs?: string[] | undefined;
            outputs?: string[] | undefined;
            config?: Record<string, unknown> | undefined;
        };
    }[];
    edges: {
        id: string;
        source: string;
        target: string;
        data?: {
            streamActive?: boolean | undefined;
            messageCount?: number | undefined;
        } | undefined;
        sourceHandle?: string | undefined;
        targetHandle?: string | undefined;
        animated?: boolean | undefined;
    }[];
    description?: string | undefined;
    createdAt?: Date | undefined;
    updatedAt?: Date | undefined;
}>;
