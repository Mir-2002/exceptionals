import React from "react";

const InputBox = ({ type, placeholder, value, onChange, required }) => {
  return (
    <input
      type={type}
      className="w-1/2 border-b-2 border-gray-400 p-2 text-lg focus:outline-none focus:border-yellow-500"
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      required={required}
    />
  );
};

export default InputBox;
