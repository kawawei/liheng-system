import React from 'react';

/**
 * @file TextField.tsx
 * @description 輸入框組件 / Text Field Component
 * @description_en Encapsulates @kawawei/frontend-modules caas-text-field Web Component
 * @description_zh 封裝 @kawawei/frontend-modules 之 caas-text-field 組件
 */

export interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const TextField: React.FC<TextFieldProps> = ({
  label,
  error,
  className = '',
  id,
  type = 'text',
  placeholder,
  value,
  onChange,
  required,
  maxLength,
  ...props
}) => {
  return (
    <div className="form-group">
      {label && (
        <label className="form-label" htmlFor={id}>
          {label} {required ? '*' : ''}
        </label>
      )}
      <input
        id={id}
        type={type}
        className={`form-input ${error ? 'is-invalid' : ''} ${className}`}
        value={value}
        placeholder={placeholder}
        maxLength={maxLength}
        onChange={onChange}
        {...props}
      />
      {error && <div className="form-error-msg">{error}</div>}
    </div>
  );
};
