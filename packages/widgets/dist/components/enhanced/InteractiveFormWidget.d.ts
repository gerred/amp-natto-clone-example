import React from 'react';
import { WidgetProps } from '../../core/types';
interface FormField {
    key: string;
    type: 'text' | 'number' | 'email' | 'password' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'date' | 'time' | 'datetime' | 'file' | 'range' | 'color';
    label: string;
    placeholder?: string;
    required?: boolean;
    disabled?: boolean;
    readonly?: boolean;
    defaultValue?: any;
    options?: Array<{
        value: any;
        label: string;
        disabled?: boolean;
    }>;
    validation?: ValidationRule[];
    description?: string;
    className?: string;
    style?: React.CSSProperties;
    min?: number | string;
    max?: number | string;
    step?: number | string;
    pattern?: string;
    multiple?: boolean;
    accept?: string;
    rows?: number;
    cols?: number;
}
interface ValidationRule {
    type: 'required' | 'minLength' | 'maxLength' | 'min' | 'max' | 'pattern' | 'email' | 'custom';
    value?: any;
    message: string;
    validator?: (value: any, formData: Record<string, any>) => boolean;
}
interface FormConfig {
    fields: FormField[];
    layout?: 'vertical' | 'horizontal' | 'grid';
    columns?: number;
    submitButton?: {
        label: string;
        disabled?: boolean;
        loading?: boolean;
    };
    resetButton?: {
        label: string;
        confirm?: boolean;
    };
    autoSave?: {
        enabled: boolean;
        delay: number;
        key?: string;
    };
    validation?: {
        mode: 'onChange' | 'onBlur' | 'onSubmit';
        showErrors: boolean;
        stopOnFirstError: boolean;
    };
    styling?: {
        theme: 'default' | 'minimal' | 'bordered';
        size: 'small' | 'medium' | 'large';
        spacing: number;
    };
}
interface InteractiveFormWidgetProps extends WidgetProps {
    formConfig?: FormConfig;
    initialData?: Record<string, any>;
    onSubmit?: (data: Record<string, any>) => void;
    onReset?: () => void;
    onChange?: (data: Record<string, any>, field?: string) => void;
}
export declare const InteractiveFormWidget: React.FC<InteractiveFormWidgetProps>;
export default InteractiveFormWidget;
