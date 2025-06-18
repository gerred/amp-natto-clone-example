import React from 'react';
import { widgetEngine } from './WidgetEngine';
// Import widget components
import { EnhancedChartWidget } from '../components/enhanced/EnhancedChartWidget';
import { VirtualizedTableWidget } from '../components/enhanced/VirtualizedTableWidget';
import { StreamingLogWidget } from '../components/enhanced/StreamingLogWidget';
import { InteractiveFormWidget } from '../components/enhanced/InteractiveFormWidget';
// Widget type definitions
const WIDGET_TYPES = {
    'chart': {
        name: 'chart',
        version: '1.0.0',
        renderer: {
            render: () => { },
            update: () => { },
            destroy: () => { }
        },
        schema: {
            type: 'object',
            properties: {
                chartConfig: {
                    type: 'object',
                    properties: {
                        type: { type: 'string', enum: ['line', 'bar', 'scatter', 'area'] },
                        animation: { type: 'boolean' },
                        grid: { type: 'boolean' },
                        tooltip: { type: 'boolean' },
                        legend: { type: 'boolean' }
                    }
                },
                realTimeUpdate: { type: 'boolean' },
                compressionRatio: { type: 'number', minimum: 0.1, maximum: 1.0 },
                virtualizeThreshold: { type: 'number', minimum: 100 }
            },
            additionalProperties: true
        },
        capabilities: {
            interactive: true,
            realtime: true,
            resizable: true,
            configurable: true,
            exportable: true
        }
    },
    'table': {
        name: 'table',
        version: '1.0.0',
        renderer: {
            render: () => { },
            update: () => { },
            destroy: () => { }
        },
        schema: {
            type: 'object',
            properties: {
                tableConfig: {
                    type: 'object',
                    properties: {
                        columns: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    key: { type: 'string' },
                                    title: { type: 'string' },
                                    width: { type: 'number' },
                                    sortable: { type: 'boolean' },
                                    filterable: { type: 'boolean' }
                                },
                                required: ['key', 'title']
                            }
                        },
                        sortable: { type: 'boolean' },
                        filterable: { type: 'boolean' },
                        selectable: { type: 'boolean' },
                        virtualScrolling: {
                            type: 'object',
                            properties: {
                                enabled: { type: 'boolean' },
                                threshold: { type: 'number' }
                            }
                        }
                    }
                },
                maxRows: { type: 'number', minimum: 100 }
            },
            additionalProperties: true
        },
        capabilities: {
            interactive: true,
            realtime: true,
            resizable: true,
            configurable: true,
            exportable: true
        }
    },
    'log': {
        name: 'log',
        version: '1.0.0',
        renderer: {
            render: () => { },
            update: () => { },
            destroy: () => { }
        },
        schema: {
            type: 'object',
            properties: {
                logConfig: {
                    type: 'object',
                    properties: {
                        maxEntries: { type: 'number', minimum: 100 },
                        autoScroll: { type: 'boolean' },
                        showTimestamp: { type: 'boolean' },
                        showLevel: { type: 'boolean' },
                        showSource: { type: 'boolean' },
                        filters: {
                            type: 'object',
                            properties: {
                                levels: { type: 'array', items: { type: 'string' } },
                                sources: { type: 'array', items: { type: 'string' } },
                                keywords: { type: 'array', items: { type: 'string' } }
                            }
                        }
                    }
                },
                realTimeUpdate: { type: 'boolean' },
                maxEntries: { type: 'number', minimum: 100 }
            },
            additionalProperties: true
        },
        capabilities: {
            interactive: true,
            realtime: true,
            resizable: true,
            configurable: true,
            exportable: false
        }
    },
    'form': {
        name: 'form',
        version: '1.0.0',
        renderer: {
            render: () => { },
            update: () => { },
            destroy: () => { }
        },
        schema: {
            type: 'object',
            properties: {
                formConfig: {
                    type: 'object',
                    properties: {
                        fields: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    key: { type: 'string' },
                                    type: { type: 'string', enum: ['text', 'number', 'email', 'password', 'textarea', 'select', 'checkbox', 'radio'] },
                                    label: { type: 'string' },
                                    required: { type: 'boolean' },
                                    validation: {
                                        type: 'array',
                                        items: {
                                            type: 'object',
                                            properties: {
                                                type: { type: 'string' },
                                                value: {},
                                                message: { type: 'string' }
                                            },
                                            required: ['type', 'message']
                                        }
                                    }
                                },
                                required: ['key', 'type', 'label']
                            }
                        },
                        layout: { type: 'string', enum: ['vertical', 'horizontal', 'grid'] },
                        validation: {
                            type: 'object',
                            properties: {
                                mode: { type: 'string', enum: ['onChange', 'onBlur', 'onSubmit'] },
                                showErrors: { type: 'boolean' }
                            }
                        }
                    },
                    required: ['fields']
                },
                initialData: { type: 'object' }
            },
            additionalProperties: true
        },
        capabilities: {
            interactive: true,
            realtime: false,
            resizable: true,
            configurable: true,
            exportable: false
        }
    }
};
// Component registry
const WIDGET_COMPONENTS = {
    'chart': EnhancedChartWidget,
    'table': VirtualizedTableWidget,
    'log': StreamingLogWidget,
    'form': InteractiveFormWidget
};
export class WidgetFactory {
    customTypes = new Map();
    customComponents = new Map();
    create(type, config) {
        const widgetType = this.getWidgetType(type);
        if (!widgetType) {
            throw new Error(`Unknown widget type: ${type}`);
        }
        // Validate configuration against schema
        const validationErrors = this.validateConfig(config, widgetType.schema);
        if (validationErrors.length > 0) {
            console.warn(`Widget configuration validation warnings for ${type}:`, validationErrors);
        }
        // Create widget instance
        const widget = widgetEngine.createWidget({
            type: widgetType,
            nodeId: config.nodeId || 'unknown',
            config: config
        });
        return widget;
    }
    register(type, component) {
        this.customTypes.set(type.name, type);
        if (component) {
            this.customComponents.set(type.name, component);
        }
    }
    unregister(typeName) {
        this.customTypes.delete(typeName);
        this.customComponents.delete(typeName);
    }
    getAvailable() {
        const builtInTypes = Object.values(WIDGET_TYPES);
        const customTypes = Array.from(this.customTypes.values());
        return [...builtInTypes, ...customTypes];
    }
    getWidgetType(typeName) {
        return WIDGET_TYPES[typeName] || this.customTypes.get(typeName);
    }
    getWidgetComponent(typeName) {
        return WIDGET_COMPONENTS[typeName] || this.customComponents.get(typeName);
    }
    // React component factory
    createReactComponent(type, props) {
        const Component = this.getWidgetComponent(type);
        if (!Component) {
            console.error(`No React component found for widget type: ${type}`);
            return null;
        }
        return React.createElement(Component, props);
    }
    // Configuration validation
    validateConfig(config, schema) {
        const errors = [];
        if (schema.type === 'object' && schema.properties) {
            Object.entries(schema.properties).forEach(([key, propSchema]) => {
                const value = config[key];
                if (propSchema.required && value === undefined) {
                    errors.push(`Missing required property: ${key}`);
                }
                if (value !== undefined) {
                    const propErrors = this.validateValue(value, propSchema, key);
                    errors.push(...propErrors);
                }
            });
        }
        return errors;
    }
    validateValue(value, schema, path) {
        const errors = [];
        // Type validation
        if (schema.type) {
            const actualType = Array.isArray(value) ? 'array' : typeof value;
            if (actualType !== schema.type) {
                errors.push(`Invalid type for ${path}: expected ${schema.type}, got ${actualType}`);
                return errors;
            }
        }
        // Enum validation
        if (schema.enum && !schema.enum.includes(value)) {
            errors.push(`Invalid value for ${path}: must be one of ${schema.enum.join(', ')}`);
        }
        // Number validation
        if (typeof value === 'number') {
            if (schema.minimum !== undefined && value < schema.minimum) {
                errors.push(`Value for ${path} must be >= ${schema.minimum}`);
            }
            if (schema.maximum !== undefined && value > schema.maximum) {
                errors.push(`Value for ${path} must be <= ${schema.maximum}`);
            }
        }
        // String validation
        if (typeof value === 'string') {
            if (schema.minLength !== undefined && value.length < schema.minLength) {
                errors.push(`Value for ${path} must be at least ${schema.minLength} characters`);
            }
            if (schema.maxLength !== undefined && value.length > schema.maxLength) {
                errors.push(`Value for ${path} must be at most ${schema.maxLength} characters`);
            }
        }
        // Array validation
        if (Array.isArray(value) && schema.items) {
            value.forEach((item, index) => {
                const itemErrors = this.validateValue(item, schema.items, `${path}[${index}]`);
                errors.push(...itemErrors);
            });
        }
        // Object validation
        if (schema.type === 'object' && schema.properties) {
            Object.entries(schema.properties).forEach(([key, propSchema]) => {
                if (value[key] !== undefined) {
                    const propErrors = this.validateValue(value[key], propSchema, `${path}.${key}`);
                    errors.push(...propErrors);
                }
            });
        }
        return errors;
    }
    // Widget capabilities check
    hasCapability(type, capability) {
        const widgetType = this.getWidgetType(type);
        return widgetType?.capabilities[capability] || false;
    }
    // Get supported widget types by capability
    getWidgetsByCapability(capability) {
        return this.getAvailable().filter(type => type.capabilities[capability]);
    }
    // Clone widget configuration
    cloneConfig(config) {
        return JSON.parse(JSON.stringify(config));
    }
    // Merge configurations
    mergeConfigs(base, override) {
        return this.deepMerge(base, override);
    }
    deepMerge(target, source) {
        const result = { ...target };
        for (const key in source) {
            if (source[key] !== null && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                result[key] = this.deepMerge(result[key] || {}, source[key]);
            }
            else {
                result[key] = source[key];
            }
        }
        return result;
    }
    // Export widget configuration
    exportConfig(widget) {
        return JSON.stringify({
            type: widget.type.name,
            config: widget.config,
            state: widget.state
        }, null, 2);
    }
    // Import widget configuration
    importConfig(configJson) {
        try {
            const parsed = JSON.parse(configJson);
            return {
                type: parsed.type,
                config: parsed.config,
                state: parsed.state
            };
        }
        catch (error) {
            throw new Error(`Invalid widget configuration JSON: ${error}`);
        }
    }
}
// Singleton instance
export const widgetFactory = new WidgetFactory();
// Helper functions for common widget creation patterns
export function createChartWidget(config) {
    return widgetFactory.create('chart', config);
}
export function createTableWidget(config) {
    return widgetFactory.create('table', config);
}
export function createLogWidget(config) {
    return widgetFactory.create('log', config);
}
export function createFormWidget(config) {
    return widgetFactory.create('form', config);
}
// React component creation helpers
export function createChartComponent(props) {
    return widgetFactory.createReactComponent('chart', props);
}
export function createTableComponent(props) {
    return widgetFactory.createReactComponent('table', props);
}
export function createLogComponent(props) {
    return widgetFactory.createReactComponent('log', props);
}
export function createFormComponent(props) {
    return widgetFactory.createReactComponent('form', props);
}
