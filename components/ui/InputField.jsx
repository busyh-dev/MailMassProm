// components/ui/InputField.jsx

import React from "react";
import { Eye, EyeOff } from "lucide-react";
import { AlertCircle } from "lucide-react";


const InputField = ({
  name,
  type = "text",
  placeholder,
  icon: Icon,
  value,
  onChange,
  errors = {},
  showPasswordToggle = false,
  showPassword,
  onTogglePassword,
  isLoading = false,
}) => {
  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Icon className="h-5 w-5 text-gray-400" />
      </div>
      <input
        type={showPasswordToggle ? (showPassword ? "text" : "password") : type}
        name={name}
        value={value}
        onChange={onChange}
        className={`block w-full pl-10 pr-10 py-3 border rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:border-transparent transition-colors ${
          errors[name]
            ? "border-red-300 focus:ring-red-500"
            : "border-gray-300 focus:ring-blue-500"
        }`}
        placeholder={placeholder}
        disabled={isLoading}
        autoComplete={
          name === "email"
            ? "email"
            : name === "password"
            ? "current-password"
            : name === "confirmPassword"
            ? "new-password"
            : name === "name"
            ? "name"
            : "off"
        }
      />
      {showPasswordToggle && (
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
          <button
            type="button"
            className="text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600"
            onClick={onTogglePassword}
            disabled={isLoading}
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
      )}
      {errors[name] && (
        <div className="mt-1 flex items-center text-sm text-red-600">
          <AlertCircle className="h-4 w-4 mr-1" />
          {errors[name]}
        </div>
      )}
    </div>
  );
};

export default InputField;
