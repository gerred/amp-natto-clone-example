import React from 'react';
import type { WidgetProps } from '../types';
interface WidgetContainerProps extends WidgetProps {
    children: React.ReactNode;
    onClose?: () => void;
    onSettings?: () => void;
}
export declare function WidgetContainer({ id, title, children, onClose, onSettings, }: WidgetContainerProps): import("react/jsx-runtime").JSX.Element;
export {};
