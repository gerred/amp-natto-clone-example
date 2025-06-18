import React from 'react';
import { Widget, WidgetType, WidgetConfig, WidgetFactory as IWidgetFactory } from './types';
export declare class WidgetFactory implements IWidgetFactory {
    private customTypes;
    private customComponents;
    create(type: string, config: WidgetConfig): Widget;
    register(type: WidgetType, component?: React.ComponentType<any>): void;
    unregister(typeName: string): void;
    getAvailable(): WidgetType[];
    getWidgetType(typeName: string): WidgetType | undefined;
    getWidgetComponent(typeName: string): React.ComponentType<any> | undefined;
    createReactComponent(type: string, props: any): React.ReactElement | null;
    private validateConfig;
    private validateValue;
    hasCapability(type: string, capability: keyof WidgetType['capabilities']): boolean;
    getWidgetsByCapability(capability: keyof WidgetType['capabilities']): WidgetType[];
    cloneConfig(config: WidgetConfig): WidgetConfig;
    mergeConfigs(base: WidgetConfig, override: WidgetConfig): WidgetConfig;
    private deepMerge;
    exportConfig(widget: Widget): string;
    importConfig(configJson: string): {
        type: string;
        config: WidgetConfig;
        state?: any;
    };
}
export declare const widgetFactory: WidgetFactory;
export declare function createChartWidget(config: any): Widget;
export declare function createTableWidget(config: any): Widget;
export declare function createLogWidget(config: any): Widget;
export declare function createFormWidget(config: any): Widget;
export declare function createChartComponent(props: any): React.ReactElement | null;
export declare function createTableComponent(props: any): React.ReactElement | null;
export declare function createLogComponent(props: any): React.ReactElement | null;
export declare function createFormComponent(props: any): React.ReactElement | null;
