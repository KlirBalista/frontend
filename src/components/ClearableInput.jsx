import React from 'react';
import { X } from 'lucide-react';

/**
 * ClearableInput - A reusable input component with clear functionality
 * 
 * @param {Object} props - Component props
 * @param {string} props.type - Input type (text, email, tel, etc.)
 * @param {string} props.name - Input name attribute
 * @param {string} props.value - Input value
 * @param {function} props.onChange - Change handler function
 * @param {function} props.onClear - Clear handler function (optional)
 * @param {string} props.placeholder - Input placeholder
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.showClearButton - Show/hide clear button (default: true)
 * @param {boolean} props.clearOnEmpty - Only show clear button when field has value (default: true)
 * @param {string} props.clearButtonPosition - Position of clear button ('inside' or 'outside', default: 'inside')
 * @param {boolean} props.required - Required field
 * @param {boolean} props.disabled - Disabled state
 */
const ClearableInput = ({
  type = 'text',
  name,
  value = '',
  onChange,
  onClear,
  placeholder = '',
  className = '',
  showClearButton = true,
  clearOnEmpty = true,
  clearButtonPosition = 'inside',
  required = false,
  disabled = false,
  ...props
}) => {
  const handleClear = () => {
    if (onClear) {
      onClear(name);
    } else if (onChange) {
      // Default clear behavior - trigger onChange with empty value
      const event = {
        target: {
          name,
          value: ''
        }
      };
      onChange(event);
    }
  };

  const shouldShowClearButton = showClearButton && (!clearOnEmpty || (clearOnEmpty && value));

  const baseInputClasses = "w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";
  const inputClasses = clearButtonPosition === 'inside' && shouldShowClearButton 
    ? `${baseInputClasses} pr-10` 
    : baseInputClasses;

  if (clearButtonPosition === 'outside') {
    return (
      <div className="flex items-center space-x-2">
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className={`${inputClasses} ${className}`}
          {...props}
        />
        {shouldShowClearButton && (
          <button
            type="button"
            onClick={handleClear}
            disabled={disabled}
            className="flex-shrink-0 p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Clear field"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  }

  // Inside position (default)
  return (
    <div className="relative">
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className={`${inputClasses} ${className}`}
        {...props}
      />
      {shouldShowClearButton && (
        <button
          type="button"
          onClick={handleClear}
          disabled={disabled}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Clear field"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

/**
 * ClearableTextarea - A reusable textarea component with clear functionality
 */
export const ClearableTextarea = ({
  name,
  value = '',
  onChange,
  onClear,
  placeholder = '',
  className = '',
  rows = 3,
  showClearButton = true,
  clearOnEmpty = true,
  clearButtonPosition = 'outside',
  required = false,
  disabled = false,
  ...props
}) => {
  const handleClear = () => {
    if (onClear) {
      onClear(name);
    } else if (onChange) {
      const event = {
        target: {
          name,
          value: ''
        }
      };
      onChange(event);
    }
  };

  const shouldShowClearButton = showClearButton && (!clearOnEmpty || (clearOnEmpty && value));

  const baseTextareaClasses = "w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical";

  if (clearButtonPosition === 'inside') {
    return (
      <div className="relative">
        <textarea
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          rows={rows}
          required={required}
          disabled={disabled}
          className={`${baseTextareaClasses} ${shouldShowClearButton ? 'pr-10' : ''} ${className}`}
          {...props}
        />
        {shouldShowClearButton && (
          <button
            type="button"
            onClick={handleClear}
            disabled={disabled}
            className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Clear field"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  }

  // Outside position (default for textarea)
  return (
    <div>
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        required={required}
        disabled={disabled}
        className={`${baseTextareaClasses} ${className}`}
        {...props}
      />
      {shouldShowClearButton && (
        <div className="flex justify-between items-center mt-2">
          <span className="text-sm text-gray-500">
            {value.length} characters
          </span>
          <button
            type="button"
            onClick={handleClear}
            disabled={disabled}
            className="text-sm text-red-600 hover:text-red-800 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X className="w-3 h-3 mr-1" />
            Clear
          </button>
        </div>
      )}
    </div>
  );
};

export default ClearableInput;