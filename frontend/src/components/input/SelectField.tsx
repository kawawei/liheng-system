import React, { useState, useRef, useEffect } from 'react';
import { TextIcon, IconName } from '../icon/TextIcon';
import './SelectField.css';

/**
 * @file SelectField.tsx
 * @description 自訂選單控制項 / Custom Select Field Component
 * @description_en Custom dropdown component replacing native HTML select with CaaS styled menu and icons
 * @description_zh 全面替代原生 select 選單，提供符合 CaaS 設計語言之精美下拉選項與文字圖標
 */

export interface SelectOption {
  value: string;
  label: string;
  iconName?: IconName;
}

interface SelectFieldProps {
  id?: string;
  label?: string;
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  style?: React.CSSProperties;
  className?: string;
}

export const SelectField: React.FC<SelectFieldProps> = ({
  label,
  options,
  value,
  onChange,
  style,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value) || options[0];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`select-field-container ${className}`} style={style} ref={containerRef}>
      {label && <label className="form-label">{label}</label>}
      <button
        type="button"
        className={`select-trigger ${isOpen ? 'is-open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {selectedOption?.iconName && <TextIcon name={selectedOption.iconName} size="sm" />}
          <span>{selectedOption?.label || '請選擇'}</span>
        </span>
        <TextIcon name="arrow-right" size="sm" style={{ transform: isOpen ? 'rotate(-90deg)' : 'rotate(90deg)', transition: 'transform 0.2s' }} />
      </button>

      {isOpen && (
        <div className="select-dropdown-menu">
          {options.map((opt) => (
            <div
              key={opt.value}
              className={`select-option-item ${opt.value === value ? 'selected' : ''}`}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
            >
              {opt.iconName && <TextIcon name={opt.iconName} size="sm" />}
              <span>{opt.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
