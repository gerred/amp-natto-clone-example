import React from 'react';
import { WidgetContainerProps } from '../../core/types';
interface EnhancedWidgetContainerProps extends WidgetContainerProps {
    onResize?: (size: {
        width: number;
        height: number;
    }) => void;
    onMove?: (position: {
        x: number;
        y: number;
    }) => void;
    onCollapse?: (collapsed: boolean) => void;
    onMinimize?: (minimized: boolean) => void;
    maxWidth?: number;
    maxHeight?: number;
    minWidth?: number;
    minHeight?: number;
    aspectRatio?: number;
    theme?: 'light' | 'dark' | 'auto';
    elevation?: number;
    borderRadius?: number;
    showPerformanceMetrics?: boolean;
}
export declare const WidgetContainer: React.FC<EnhancedWidgetContainerProps>;
export default WidgetContainer;
