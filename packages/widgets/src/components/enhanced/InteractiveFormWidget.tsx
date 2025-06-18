import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { debounce } from 'lodash';
import { WidgetContainer } from './WidgetContainer';
import { usePerformanceMonitor } from '../../hooks/usePerformanceMonitor';
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
  options?: Array<{ value: any; label: string; disabled?: boolean }>;
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

interface FormErrors {
  [key: string]: string[];
}

interface InteractiveFormWidgetProps extends WidgetProps {
  formConfig?: FormConfig;
  initialData?: Record<string, any>;
  onSubmit?: (data: Record<string, any>) => void;
  onReset?: () => void;
  onChange?: (data: Record<string, any>, field?: string) => void;
}

export const InteractiveFormWidget: React.FC<InteractiveFormWidgetProps> = ({
  id,
  title,
  config = {},
  formConfig,
  initialData = {},
  onSubmit,
  onReset,
  onChange,
  onEvent,
  ...props
}) => {
  const formRef = useRef<HTMLFormElement>(null);
  const { startMonitoring, stopMonitoring, metrics } = usePerformanceMonitor(id);

  // State management
  const [formData, setFormData] = useState<Record<string, any>>(initialData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Form configuration with defaults
  const finalFormConfig = useMemo((): FormConfig => {
    const defaultConfig: FormConfig = {
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
    const defaultData: Record<string, any> = {};
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
  const validateField = useCallback((field: FormField, value: any, allData: Record<string, any>): string[] => {
    const fieldErrors: string[] = [];
    
    if (!field.validation) return fieldErrors;

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
  const validateForm = useCallback((data: Record<string, any> = formData): FormErrors => {
    const newErrors: FormErrors = {};
    
    finalFormConfig.fields.forEach(field => {
      const fieldErrors = validateField(field, data[field.key], data);
      if (fieldErrors.length > 0) {
        newErrors[field.key] = fieldErrors;
      }
    });

    return newErrors;
  }, [formData, finalFormConfig.fields, validateField]);

  // Debounced auto-save
  const debouncedAutoSave = useMemo(
    () => debounce((data: Record<string, any>) => {
      if (finalFormConfig.autoSave?.enabled && finalFormConfig.autoSave.key) {
        localStorage.setItem(finalFormConfig.autoSave.key, JSON.stringify(data));
      }
      
      if (onChange) {
        onChange(data);
      }
    }, finalFormConfig.autoSave?.delay || 2000),
    [finalFormConfig.autoSave, onChange]
  );

  // Handle field changes
  const handleFieldChange = useCallback((fieldKey: string, value: any) => {
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
        type: 'change' as any,
        source: { id } as any,
        data: { field: fieldKey, value, formData: newData },
        timestamp: Date.now(),
        propagate: false
      });
    }
  }, [formData, finalFormConfig, validateField, debouncedAutoSave, onChange, onEvent, id]);

  // Handle field blur
  const handleFieldBlur = useCallback((fieldKey: string) => {
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
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
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
            type: 'submit' as any,
            source: { id } as any,
            data: { formData, success: true },
            timestamp: Date.now(),
            propagate: true
          });
        }
        
        setIsDirty(false);
      } catch (error) {
        if (onEvent) {
          onEvent({
            type: 'submit' as any,
            source: { id } as any,
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
        type: 'custom' as any,
        source: { id } as any,
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
  const renderField = useCallback((field: FormField) => {
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
      onChange: (e: React.ChangeEvent<any>) => {
        let newValue = e.target.value;
        
        // Type conversion
        if (field.type === 'number') {
          newValue = newValue === '' ? '' : Number(newValue);
        } else if (field.type === 'checkbox') {
          newValue = e.target.checked;
        }
        
        handleFieldChange(field.key, newValue);
      },
      onBlur: () => handleFieldBlur(field.key)
    };

    let fieldElement: React.ReactNode;

    switch (field.type) {
      case 'textarea':
        fieldElement = (
          <textarea
            {...commonProps}
            value={value}
            placeholder={field.placeholder}
            rows={field.rows}
            cols={field.cols}
          />
        );
        break;

      case 'select':
        fieldElement = (
          <select {...commonProps} value={value} multiple={field.multiple}>
            {field.placeholder && (
              <option value="" disabled>
                {field.placeholder}
              </option>
            )}
            {field.options?.map(option => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </select>
        );
        break;

      case 'checkbox':
        fieldElement = (
          <input
            {...commonProps}
            type="checkbox"
            checked={Boolean(value)}
            onChange={(e) => handleFieldChange(field.key, e.target.checked)}
          />
        );
        break;

      case 'radio':
        fieldElement = (
          <div className="radio-group">
            {field.options?.map(option => (
              <label key={option.value} className="radio-option">
                <input
                  type="radio"
                  name={field.key}
                  value={option.value}
                  checked={value === option.value}
                  disabled={field.disabled || option.disabled}
                  onChange={(e) => handleFieldChange(field.key, e.target.value)}
                />
                {option.label}
              </label>
            ))}
          </div>
        );
        break;

      case 'file':
        fieldElement = (
          <input
            {...commonProps}
            type="file"
            accept={field.accept}
            multiple={field.multiple}
            onChange={(e) => {
              const files = field.multiple ? Array.from(e.target.files || []) : e.target.files?.[0];
              handleFieldChange(field.key, files);
            }}
          />
        );
        break;

      case 'range':
        fieldElement = (
          <input
            {...commonProps}
            type="range"
            value={value}
            min={field.min}
            max={field.max}
            step={field.step}
          />
        );
        break;

      default:
        fieldElement = (
          <input
            {...commonProps}
            type={field.type}
            value={value}
            placeholder={field.placeholder}
            min={field.min}
            max={field.max}
            step={field.step}
            pattern={field.pattern}
          />
        );
    }

    return (
      <div key={field.key} className="form-field-container">
        <label htmlFor={`${id}-${field.key}`} className="form-label">
          {field.label}
          {field.required && <span className="required-indicator">*</span>}
        </label>
        {fieldElement}
        {field.description && (
          <div className="field-description">{field.description}</div>
        )}
        {showErrors && fieldErrors.length > 0 && (
          <div className="field-errors">
            {fieldErrors.map((error, index) => (
              <div key={index} className="field-error">
                {error}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }, [formData, errors, touched, finalFormConfig, id, handleFieldChange, handleFieldBlur]);

  const hasErrors = Object.keys(errors).length > 0;
  const canSubmit = !isSubmitting && !hasErrors;

  return (
    <WidgetContainer
      id={id}
      title={title || 'Interactive Form'}
      toolbar={
        <div className="form-toolbar">
          {isDirty && <span className="dirty-indicator">●</span>}
          {metrics && (
            <span className="performance-info">
              {Object.keys(formData).length} fields
            </span>
          )}
        </div>
      }
      {...props}
    >
      <form
        ref={formRef}
        className={`interactive-form ${finalFormConfig.styling?.theme} ${finalFormConfig.styling?.size}`}
        onSubmit={handleSubmit}
        noValidate
      >
        <div 
          className={`form-fields ${finalFormConfig.layout}`}
          style={{
            gridTemplateColumns: finalFormConfig.layout === 'grid' 
              ? `repeat(${finalFormConfig.columns}, 1fr)` 
              : undefined,
            gap: finalFormConfig.styling?.spacing
          }}
        >
          {finalFormConfig.fields.map(renderField)}
        </div>
        
        <div className="form-actions">
          {finalFormConfig.submitButton && (
            <button
              type="submit"
              className="submit-button"
              disabled={!canSubmit || finalFormConfig.submitButton.disabled}
            >
              {isSubmitting ? 'Submitting...' : finalFormConfig.submitButton.label}
            </button>
          )}
          
          {finalFormConfig.resetButton && (
            <button
              type="button"
              className="reset-button"
              onClick={handleReset}
            >
              {finalFormConfig.resetButton.label}
            </button>
          )}
        </div>
      </form>
    </WidgetContainer>
  );
};

export default InteractiveFormWidget;
