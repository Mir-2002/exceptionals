import React from 'react';

export const LoadingSpinner = ({ size = "medium", color = "blue" }) => {
  const sizeClass = {
    small: "w-4 h-4",
    medium: "w-8 h-8",
    large: "w-12 h-12"
  };
  
  const colorClass = {
    blue: "text-blue-600 border-blue-600",
    white: "text-white border-white",
    gray: "text-gray-600 border-gray-600",
    green: "text-green-600 border-green-600",
    sky: "text-sky-600 border-sky-600"
  };
  
  return (
    <div className="flex justify-center items-center">
      <div 
        className={`animate-spin rounded-full border-2 border-t-transparent ${sizeClass[size]} ${colorClass[color]}`}
        style={{ borderTopColor: 'transparent' }}
      >
        <span className="sr-only">Loading...</span>
      </div>
    </div>
  );
};

export default LoadingSpinner;