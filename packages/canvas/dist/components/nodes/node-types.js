export const INPUT_NODES = [
    {
        type: 'text-input',
        label: 'Text Input',
        category: 'input',
        description: 'Manual text input with configurable default value',
        icon: '📝',
        inputs: [],
        outputs: [
            {
                id: 'text',
                label: 'Text',
                type: 'string',
            },
        ],
        config: {
            defaultValue: '',
            placeholder: 'Enter text...',
        },
    },
    {
        type: 'number-input',
        label: 'Number Input',
        category: 'input',
        description: 'Numeric input with validation and formatting',
        icon: '🔢',
        inputs: [],
        outputs: [
            {
                id: 'number',
                label: 'Number',
                type: 'number',
            },
        ],
        config: {
            defaultValue: 0,
            min: null,
            max: null,
            step: 1,
        },
    },
    {
        type: 'file-input',
        label: 'File Input',
        category: 'input',
        description: 'File upload with type filtering and validation',
        icon: '📁',
        inputs: [],
        outputs: [
            {
                id: 'file',
                label: 'File',
                type: 'object',
            },
            {
                id: 'filename',
                label: 'Filename',
                type: 'string',
            },
            {
                id: 'size',
                label: 'Size',
                type: 'number',
            },
        ],
        config: {
            acceptedTypes: ['*/*'],
            maxSize: 10485760, // 10MB
        },
    },
    {
        type: 'json-input',
        label: 'JSON Input',
        category: 'input',
        description: 'JSON data input with validation and formatting',
        icon: '📋',
        inputs: [],
        outputs: [
            {
                id: 'data',
                label: 'Data',
                type: 'object',
            },
        ],
        config: {
            defaultValue: '{}',
            validateJSON: true,
        },
    },
];
export const TRANSFORM_NODES = [
    {
        type: 'text-transform',
        label: 'Text Transform',
        category: 'transform',
        description: 'Transform text with operations like uppercase, lowercase, trim',
        icon: '🔄',
        inputs: [
            {
                id: 'text',
                label: 'Text',
                type: 'string',
                required: true,
            },
        ],
        outputs: [
            {
                id: 'result',
                label: 'Result',
                type: 'string',
            },
        ],
        config: {
            operation: 'trim',
            operations: ['uppercase', 'lowercase', 'trim', 'reverse'],
        },
    },
    {
        type: 'math-operation',
        label: 'Math Operation',
        category: 'transform',
        description: 'Perform mathematical operations on numeric inputs',
        icon: '➕',
        inputs: [
            {
                id: 'a',
                label: 'A',
                type: 'number',
                required: true,
            },
            {
                id: 'b',
                label: 'B',
                type: 'number',
                required: true,
            },
        ],
        outputs: [
            {
                id: 'result',
                label: 'Result',
                type: 'number',
            },
        ],
        config: {
            operation: 'add',
            operations: ['add', 'subtract', 'multiply', 'divide', 'power', 'modulo'],
        },
    },
    {
        type: 'json-transform',
        label: 'JSON Transform',
        category: 'transform',
        description: 'Transform JSON data using JSONPath expressions',
        icon: '🔧',
        inputs: [
            {
                id: 'data',
                label: 'Data',
                type: 'object',
                required: true,
            },
            {
                id: 'path',
                label: 'Path',
                type: 'string',
                required: true,
            },
        ],
        outputs: [
            {
                id: 'result',
                label: 'Result',
                type: 'any',
            },
        ],
        config: {
            defaultPath: '$',
            validatePath: true,
        },
    },
    {
        type: 'conditional',
        label: 'Conditional',
        category: 'transform',
        description: 'Conditional logic with if/else branching',
        icon: '🔀',
        inputs: [
            {
                id: 'condition',
                label: 'Condition',
                type: 'boolean',
                required: true,
            },
            {
                id: 'ifTrue',
                label: 'If True',
                type: 'any',
                required: true,
            },
            {
                id: 'ifFalse',
                label: 'If False',
                type: 'any',
                required: true,
            },
        ],
        outputs: [
            {
                id: 'result',
                label: 'Result',
                type: 'any',
            },
        ],
        config: {},
    },
];
export const OUTPUT_NODES = [
    {
        type: 'console-output',
        label: 'Console Output',
        category: 'output',
        description: 'Display data in console with formatting options',
        icon: '📺',
        inputs: [
            {
                id: 'data',
                label: 'Data',
                type: 'any',
                required: true,
            },
        ],
        outputs: [],
        config: {
            format: 'json',
            formats: ['json', 'text', 'table'],
        },
    },
    {
        type: 'file-output',
        label: 'File Output',
        category: 'output',
        description: 'Save data to file with configurable format',
        icon: '💾',
        inputs: [
            {
                id: 'data',
                label: 'Data',
                type: 'any',
                required: true,
            },
            {
                id: 'filename',
                label: 'Filename',
                type: 'string',
                required: true,
            },
        ],
        outputs: [
            {
                id: 'success',
                label: 'Success',
                type: 'boolean',
            },
        ],
        config: {
            format: 'json',
            formats: ['json', 'csv', 'txt', 'xml'],
        },
    },
    {
        type: 'webhook-output',
        label: 'Webhook Output',
        category: 'output',
        description: 'Send data to webhook endpoint with custom headers',
        icon: '📡',
        inputs: [
            {
                id: 'data',
                label: 'Data',
                type: 'any',
                required: true,
            },
            {
                id: 'url',
                label: 'URL',
                type: 'string',
                required: true,
            },
        ],
        outputs: [
            {
                id: 'response',
                label: 'Response',
                type: 'object',
            },
            {
                id: 'status',
                label: 'Status',
                type: 'number',
            },
        ],
        config: {
            method: 'POST',
            headers: {},
            timeout: 30000,
        },
    },
];
export const AI_NODES = [
    {
        type: 'openai-chat',
        label: 'OpenAI Chat',
        category: 'ai',
        description: 'Chat completion using OpenAI GPT models',
        icon: '🤖',
        inputs: [
            {
                id: 'prompt',
                label: 'Prompt',
                type: 'string',
                required: true,
            },
            {
                id: 'system',
                label: 'System Message',
                type: 'string',
            },
            {
                id: 'context',
                label: 'Context',
                type: 'array',
            },
        ],
        outputs: [
            {
                id: 'response',
                label: 'Response',
                type: 'string',
            },
            {
                id: 'usage',
                label: 'Usage',
                type: 'object',
            },
        ],
        config: {
            model: 'gpt-4',
            temperature: 0.7,
            maxTokens: 1000,
            apiKey: '',
        },
    },
    {
        type: 'text-embedding',
        label: 'Text Embedding',
        category: 'ai',
        description: 'Generate text embeddings for semantic search',
        icon: '🔤',
        inputs: [
            {
                id: 'text',
                label: 'Text',
                type: 'string',
                required: true,
            },
        ],
        outputs: [
            {
                id: 'embedding',
                label: 'Embedding',
                type: 'array',
            },
            {
                id: 'dimensions',
                label: 'Dimensions',
                type: 'number',
            },
        ],
        config: {
            model: 'text-embedding-ada-002',
            apiKey: '',
        },
    },
    {
        type: 'sentiment-analysis',
        label: 'Sentiment Analysis',
        category: 'ai',
        description: 'Analyze sentiment and emotion in text',
        icon: '😊',
        inputs: [
            {
                id: 'text',
                label: 'Text',
                type: 'string',
                required: true,
            },
        ],
        outputs: [
            {
                id: 'sentiment',
                label: 'Sentiment',
                type: 'string',
            },
            {
                id: 'confidence',
                label: 'Confidence',
                type: 'number',
            },
            {
                id: 'emotions',
                label: 'Emotions',
                type: 'object',
            },
        ],
        config: {
            provider: 'openai',
            detailed: true,
        },
    },
];
export const HTTP_NODES = [
    {
        type: 'http-request',
        label: 'HTTP Request',
        category: 'http',
        description: 'Make HTTP requests with custom headers and body',
        icon: '🌐',
        inputs: [
            {
                id: 'url',
                label: 'URL',
                type: 'string',
                required: true,
            },
            {
                id: 'body',
                label: 'Body',
                type: 'any',
            },
            {
                id: 'headers',
                label: 'Headers',
                type: 'object',
            },
        ],
        outputs: [
            {
                id: 'response',
                label: 'Response',
                type: 'any',
            },
            {
                id: 'status',
                label: 'Status',
                type: 'number',
            },
            {
                id: 'headers',
                label: 'Headers',
                type: 'object',
            },
        ],
        config: {
            method: 'GET',
            timeout: 30000,
            followRedirects: true,
        },
    },
    {
        type: 'api-call',
        label: 'API Call',
        category: 'http',
        description: 'Structured API call with authentication and error handling',
        icon: '🔗',
        inputs: [
            {
                id: 'endpoint',
                label: 'Endpoint',
                type: 'string',
                required: true,
            },
            {
                id: 'params',
                label: 'Parameters',
                type: 'object',
            },
            {
                id: 'data',
                label: 'Data',
                type: 'object',
            },
        ],
        outputs: [
            {
                id: 'data',
                label: 'Data',
                type: 'any',
            },
            {
                id: 'error',
                label: 'Error',
                type: 'string',
            },
            {
                id: 'metadata',
                label: 'Metadata',
                type: 'object',
            },
        ],
        config: {
            baseURL: '',
            authentication: 'none',
            retries: 3,
            timeout: 30000,
        },
    },
];
export const FILTER_NODES = [
    {
        type: 'array-filter',
        label: 'Array Filter',
        category: 'filter',
        description: 'Filter array elements based on conditions',
        icon: '🔍',
        inputs: [
            {
                id: 'array',
                label: 'Array',
                type: 'array',
                required: true,
            },
            {
                id: 'condition',
                label: 'Condition',
                type: 'string',
                required: true,
            },
        ],
        outputs: [
            {
                id: 'filtered',
                label: 'Filtered',
                type: 'array',
            },
            {
                id: 'count',
                label: 'Count',
                type: 'number',
            },
        ],
        config: {
            condition: 'item => item.value > 0',
            caseSensitive: false,
        },
    },
    {
        type: 'object-filter',
        label: 'Object Filter',
        category: 'filter',
        description: 'Filter object properties based on keys or values',
        icon: '🎯',
        inputs: [
            {
                id: 'object',
                label: 'Object',
                type: 'object',
                required: true,
            },
            {
                id: 'keys',
                label: 'Keys',
                type: 'array',
            },
        ],
        outputs: [
            {
                id: 'filtered',
                label: 'Filtered',
                type: 'object',
            },
        ],
        config: {
            mode: 'include',
            modes: ['include', 'exclude'],
        },
    },
    {
        type: 'text-filter',
        label: 'Text Filter',
        category: 'filter',
        description: 'Filter text based on patterns and conditions',
        icon: '📝',
        inputs: [
            {
                id: 'text',
                label: 'Text',
                type: 'string',
                required: true,
            },
            {
                id: 'pattern',
                label: 'Pattern',
                type: 'string',
                required: true,
            },
        ],
        outputs: [
            {
                id: 'matches',
                label: 'Matches',
                type: 'array',
            },
            {
                id: 'hasMatch',
                label: 'Has Match',
                type: 'boolean',
            },
        ],
        config: {
            type: 'contains',
            types: ['contains', 'regex', 'startsWith', 'endsWith'],
            caseSensitive: false,
        },
    },
];
export const MERGE_NODES = [
    {
        type: 'object-merge',
        label: 'Object Merge',
        category: 'merge',
        description: 'Merge multiple objects with conflict resolution',
        icon: '🔀',
        inputs: [
            {
                id: 'primary',
                label: 'Primary',
                type: 'object',
                required: true,
            },
            {
                id: 'secondary',
                label: 'Secondary',
                type: 'object',
                required: true,
            },
            {
                id: 'tertiary',
                label: 'Tertiary',
                type: 'object',
            },
        ],
        outputs: [
            {
                id: 'merged',
                label: 'Merged',
                type: 'object',
            },
        ],
        config: {
            strategy: 'overwrite',
            strategies: ['overwrite', 'merge', 'preserve'],
            deepMerge: true,
        },
    },
    {
        type: 'array-merge',
        label: 'Array Merge',
        category: 'merge',
        description: 'Merge multiple arrays with deduplication options',
        icon: '📊',
        inputs: [
            {
                id: 'arrays',
                label: 'Arrays',
                type: 'array',
                required: true,
            },
        ],
        outputs: [
            {
                id: 'merged',
                label: 'Merged',
                type: 'array',
            },
            {
                id: 'length',
                label: 'Length',
                type: 'number',
            },
        ],
        config: {
            removeDuplicates: true,
            sortResult: false,
        },
    },
    {
        type: 'data-join',
        label: 'Data Join',
        category: 'merge',
        description: 'Join datasets based on common keys',
        icon: '🔗',
        inputs: [
            {
                id: 'left',
                label: 'Left Dataset',
                type: 'array',
                required: true,
            },
            {
                id: 'right',
                label: 'Right Dataset',
                type: 'array',
                required: true,
            },
            {
                id: 'leftKey',
                label: 'Left Key',
                type: 'string',
                required: true,
            },
            {
                id: 'rightKey',
                label: 'Right Key',
                type: 'string',
                required: true,
            },
        ],
        outputs: [
            {
                id: 'joined',
                label: 'Joined',
                type: 'array',
            },
        ],
        config: {
            joinType: 'inner',
            joinTypes: ['inner', 'left', 'right', 'outer'],
        },
    },
];
export const ALL_NODE_DEFINITIONS = [
    ...INPUT_NODES,
    ...TRANSFORM_NODES,
    ...OUTPUT_NODES,
    ...AI_NODES,
    ...HTTP_NODES,
    ...FILTER_NODES,
    ...MERGE_NODES,
];
