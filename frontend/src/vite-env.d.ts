/// <reference types="vite/client" />

/**
 * @file vite-env.d.ts
 * @description Vite 與 @kawawei/frontend-modules 型別宣告 / Vite & Frontend Modules Type Declarations
 */

declare module '@kawawei/frontend-modules' {
  import React from 'react';

  export interface SelectOption {
    label: string;
    value: string | number;
    icon?: React.ReactNode;
  }

  export interface SelectProps {
    label?: string;
    placeholder?: string;
    options: SelectOption[];
    value?: string | number | (string | number)[];
    onChange: (value: string | number | (string | number)[]) => void;
    multiple?: boolean;
    searchable?: boolean;
    showRadio?: boolean;
    showCheckbox?: boolean;
    error?: string;
    helperText?: string;
    required?: boolean;
    width?: string | number;
    height?: string | number;
    className?: string;
  }

  export interface DatePickerProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange' | 'value'> {
    label?: string;
    error?: string;
    helperText?: string;
    required?: boolean;
    width?: string | number;
    picker?: 'date' | 'month' | 'time' | 'datetime-local' | 'quarter' | 'week' | 'date-range' | 'time-range' | 'time-material';
    value?: string;
    onChange?: (value: string) => void;
    weekStart?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
    variant?: 'default' | 'arrow';
    allowInput?: boolean;
    className?: string;
  }

  export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    width?: string | number;
    height?: string | number;
  }

  export interface CheckboxProps {
    label?: string;
    checked?: boolean;
    defaultChecked?: boolean;
    onChange?: (checked: boolean) => void;
    disabled?: boolean;
    indeterminate?: boolean;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
    style?: React.CSSProperties;
  }

  export const Select: React.FC<SelectProps>;
  export const DatePicker: React.FC<DatePickerProps>;
  export const Button: React.FC<ButtonProps>;
  export const Checkbox: React.FC<CheckboxProps>;
  export const TextField: React.FC<any>;
  export const InputNumber: React.FC<any>;
  export const StatusBadge: React.FC<any>;
  export const Icon: React.FC<any>;
  export const Calendar: React.FC<any>;
}
