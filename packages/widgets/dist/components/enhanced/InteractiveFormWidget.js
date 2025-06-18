import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { debounce } from 'lodash';
import { WidgetContainer } from './WidgetContainer';
import { usePerformanceMonitor } from '../../hooks/usePerformanceMonitor';
export const InteractiveFormWidget = ({ id, title, config = {}, formConfig, initialData = {}, onSubmit, onReset, onChange, onEvent, ...props }) => {
    const formRef = useRef(null);
    const { startMonitoring, stopMonitoring, metrics } = usePerformanceMonitor(id);
    // State management
    const [formData, setFormData] = useState(initialData);
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState(new Set());
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    // Form configuration with defaults
    const finalFormConfig = useMemo(() => {
        const defaultConfig = {
            fields: [],
            layout: 'vertical',
            columns: 1,
            submitButton: {
                label: 'Submit'
            },
            resetButton: {
                label: 'Reset',
                confirm: true
            },
            autoSave: {
                enabled: false,
                delay: 2000
            },
            validation: {
                mode: 'onChange',
                showErrors: true,
                stopOnFirstError: false
            },
            styling: {
                theme: 'default',
                size: 'medium',
                spacing: 16
            }
        };
        return { ...defaultConfig, ...formConfig, ...config };
    }, [formConfig, config]);
    // Initialize form data from field defaults
    useEffect(() => {
        const defaultData = {};
        finalFormConfig.fields.forEach(field => {
            if (field.defaultValue !== undefined && !(field.key in initialData)) {
                defaultData[field.key] = field.defaultValue;
            }
        });
        if (Object.keys(defaultData).length > 0) {
            setFormData(prev => ({ ...defaultData, ...prev }));
        }
    }, [finalFormConfig.fields, initialData]);
    // Validation function
    const validateField = useCallback((field, value, allData) => {
        const fieldErrors = [];
        if (!field.validation)
            return fieldErrors;
        for (const rule of field.validation) {
            switch (rule.type) {
                case 'required':
                    if (!value && value !== 0 && value !== false) {
                        fieldErrors.push(rule.message);
                    }
                    break;
                case 'minLength':
                    if (typeof value === 'string' && value.length < rule.value) {
                        fieldErrors.push(rule.message);
                    }
                    break;
                case 'maxLength':
                    if (typeof value === 'string' && value.length > rule.value) {
                        fieldErrors.push(rule.message);
                    }
                    break;
                case 'min':
                    if (typeof value === 'number' && value < rule.value) {
                        fieldErrors.push(rule.message);
                    }
                    break;
                case 'max':
                    if (typeof value === 'number' && value > rule.value) {
                        fieldErrors.push(rule.message);
                    }
                    break;
                case 'pattern':
                    if (typeof value === 'string' && !new RegExp(rule.value).test(value)) {
                        fieldErrors.push(rule.message);
                    }
                    break;
                case 'email':
                    if (typeof value === 'string' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                        fieldErrors.push(rule.message);
                    }
                    break;
                case 'custom':
                    if (rule.validator && !rule.validator(value, allData)) {
                        fieldErrors.push(rule.message);
                    }
                    break;
            }
            if (fieldErrors.length > 0 && finalFormConfig.validation?.stopOnFirstError) {
                break;
            }
        }
        return fieldErrors;
    }, [finalFormConfig.validation]);
    // Validate all fields
    const validateForm = useCallback((data = formData) => {
        const newErrors = {};
        finalFormConfig.fields.forEach(field => {
            const fieldErrors = validateField(field, data[field.key], data);
            if (fieldErrors.length > 0) {
                newErrors[field.key] = fieldErrors;
            }
        });
        return newErrors;
    }, [formData, finalFormConfig.fields, validateField]);
    // Debounced auto-save
    const debouncedAutoSave = useMemo(() => debounce((data) => {
        if (finalFormConfig.autoSave?.enabled && finalFormConfig.autoSave.key) {
            localStorage.setItem(finalFormConfig.autoSave.key, JSON.stringify(data));
        }
        if (onChange) {
            onChange(data);
        }
    }, finalFormConfig.autoSave?.delay || 2000), [finalFormConfig.autoSave, onChange]);
    // Handle field changes
    const handleFieldChange = useCallback((fieldKey, value) => {
        const newData = { ...formData, [fieldKey]: value };
        setFormData(newData);
        setIsDirty(true);
        // Validation on change
        if (finalFormConfig.validation?.mode === 'onChange') {
            const field = finalFormConfig.fields.find(f => f.key === fieldKey);
            if (field) {
                const fieldErrors = validateField(field, value, newData);
                setErrors(prev => ({
                    ...prev,
                    [fieldKey]: fieldErrors
                }));
            }
        }
        // Auto-save
        if (finalFormConfig.autoSave?.enabled) {
            debouncedAutoSave(newData);
        }
        // Notify parent
        if (onChange) {
            onChange(newData, fieldKey);
        }
        // Emit event
        if (onEvent) {
            onEvent({
                type: 'change',
                source: { id },
                data: { field: fieldKey, value, formData: newData },
                timestamp: Date.now(),
                propagate: false
            });
        }
    }, [formData, finalFormConfig, validateField, debouncedAutoSave, onChange, onEvent, id]);
    // Handle field blur
    const handleFieldBlur = useCallback((fieldKey) => {
        setTouched(prev => new Set(prev).add(fieldKey));
        // Validation on blur
        if (finalFormConfig.validation?.mode === 'onBlur') {
            const field = finalFormConfig.fields.find(f => f.key === fieldKey);
            if (field) {
                const fieldErrors = validateField(field, formData[fieldKey], formData);
                setErrors(prev => ({
                    ...prev,
                    [fieldKey]: fieldErrors
                }));
            }
        }
    }, [formData, finalFormConfig, validateField]);
    // Handle form submission
    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        const formErrors = validateForm();
        setErrors(formErrors);
        if (Object.keys(formErrors).length === 0) {
            try {
                if (onSubmit) {
                    await onSubmit(formData);
                }
                if (onEvent) {
                    onEvent({
                        type: 'submit',
                        source: { id },
                        data: { formData, success: true },
                        timestamp: Date.now(),
                        propagate: true
                    });
                }
                setIsDirty(false);
            }
            catch (error) {
                if (onEvent) {
                    onEvent({
                        type: 'submit',
                        source: { id },
                        data: { formData, success: false, error },
                        timestamp: Date.now(),
                        propagate: true
                    });
                }
            }
        }
        setIsSubmitting(false);
    }, [formData, validateForm, onSubmit, onEvent, id]);
    // Handle form reset
    const handleReset = useCallback(() => {
        if (finalFormConfig.resetButton?.confirm) {
            if (!confirm('Are you sure you want to reset the form?')) {
                return;
            }
        }
        const resetData = { ...initialData };
        finalFormConfig.fields.forEach(field => {
            if (field.defaultValue !== undefined) {
                resetData[field.key] = field.defaultValue;
            }
        });
        setFormData(resetData);
        setErrors({});
        setTouched(new Set());
        setIsDirty(false);
        if (onReset) {
            onReset();
        }
        if (onEvent) {
            onEvent({
                type: 'custom',
                source: { id },
                data: { action: 'reset', formData: resetData },
                timestamp: Date.now(),
                propagate: false
            });
        }
    }, [finalFormConfig, initialData, onReset, onEvent, id]);
    // Performance monitoring
    useEffect(() => {
        startMonitoring();
        return () => stopMonitoring();
    }, [startMonitoring, stopMonitoring]);
    // Render field component
    const renderField = useCallback((field) => {
        const value = formData[field.key] ?? '';
        const fieldErrors = errors[field.key] || [];
        const showErrors = finalFormConfig.validation?.showErrors && touched.has(field.key);
        const commonProps = {
            id: `${id}-${field.key}`,
            name: field.key,
            disabled: field.disabled,
            readOnly: field.readonly,
            required: field.required,
            className: `form-field ${field.className || ''}`,
            style: field.style,
            onChange: (e) => {
                let newValue = e.target.value;
                // Type conversion
                if (field.type === 'number') {
                    newValue = newValue === '' ? '' : Number(newValue);
                }
                else if (field.type === 'checkbox') {
                    newValue = e.target.checked;
                }
                handleFieldChange(field.key, newValue);
            },
            onBlur: () => handleFieldBlur(field.key)
        };
        let fieldElement;
        switch (field.type) {
            case 'textarea':
                fieldElement = (_jsx("textarea", { ...commonProps, value: value, placeholder: field.placeholder, rows: field.rows, cols: field.cols }));
                break;
            case 'select':
                fieldElement = (_jsxs("select", { ...commonProps, value: value, multiple: field.multiple, children: [field.placeholder && (_jsx("option", { value: "", disabled: true, children: field.placeholder })), field.options?.map(option => (_jsx("option", { value: option.value, disabled: option.disabled, children: option.label }, option.value)))] }));
                break;
            case 'checkbox':
                fieldElement = (_jsx("input", { ...commonProps, type: "checkbox", checked: Boolean(value), onChange: (e) => handleFieldChange(field.key, e.target.checked) }));
                break;
            case 'radio':
                fieldElement = (_jsx("div", { className: "radio-group", children: field.options?.map(option => (_jsxs("label", { className: "radio-option", children: [_jsx("input", { type: "radio", name: field.key, value: option.value, checked: value === option.value, disabled: field.disabled || option.disabled, onChange: (e) => handleFieldChange(field.key, e.target.value) }), option.label] }, option.value))) }));
                break;
            case 'file':
                fieldElement = (_jsx("input", { ...commonProps, type: "file", accept: field.accept, multiple: field.multiple, onChange: (e) => {
                        const files = field.multiple ? Array.from(e.target.files || []) : e.target.files?.[0];
                        handleFieldChange(field.key, files);
                    } }));
                break;
            case 'range':
                fieldElement = (_jsx("input", { ...commonProps, type: "range", value: value, min: field.min, max: field.max, step: field.step }));
                break;
            default:
                fieldElement = (_jsx("input", { ...commonProps, type: field.type, value: value, placeholder: field.placeholder, min: field.min, max: field.max, step: field.step, pattern: field.pattern }));
        }
        return (_jsxs("div", { className: "form-field-container", children: [_jsxs("label", { htmlFor: `${id}-${field.key}`, className: "form-label", children: [field.label, field.required && _jsx("span", { className: "required-indicator", children: "*" })] }), fieldElement, field.description && (_jsx("div", { className: "field-description", children: field.description })), showErrors && fieldErrors.length > 0 && (_jsx("div", { className: "field-errors", children: fieldErrors.map((error, index) => (_jsx("div", { className: "field-error", children: error }, index))) }))] }, field.key));
    }, [formData, errors, touched, finalFormConfig, id, handleFieldChange, handleFieldBlur]);
    const hasErrors = Object.keys(errors).length > 0;
    const canSubmit = !isSubmitting && !hasErrors;
    return (_jsx(WidgetContainer, { id: id, title: title || 'Interactive Form', toolbar: _jsxs("div", { className: "form-toolbar", children: [isDirty && _jsx("span", { className: "dirty-indicator", children: "\u25CF" }), metrics && (_jsxs("span", { className: "performance-info", children: [Object.keys(formData).length, " fields"] }))] }), ...props, children: _jsxs("form", { ref: formRef, className: `interactive-form ${finalFormConfig.styling?.theme} ${finalFormConfig.styling?.size}`, onSubmit: handleSubmit, noValidate: true, children: [_jsx("div", { className: `form-fields ${finalFormConfig.layout}`, style: {
                        gridTemplateColumns: finalFormConfig.layout === 'grid'
                            ? `repeat(${finalFormConfig.columns}, 1fr)`
                            : undefined,
                        gap: finalFormConfig.styling?.spacing
                    }, children: finalFormConfig.fields.map(renderField) }), _jsxs("div", { className: "form-actions", children: [finalFormConfig.submitButton && (_jsx("button", { type: "submit", className: "submit-button", disabled: !canSubmit || finalFormConfig.submitButton.disabled, children: isSubmitting ? 'Submitting...' : finalFormConfig.submitButton.label })), finalFormConfig.resetButton && (_jsx("button", { type: "button", className: "reset-button", onClick: handleReset, children: finalFormConfig.resetButton.label }))] })] }) }));
};
export default InteractiveFormWidget;
