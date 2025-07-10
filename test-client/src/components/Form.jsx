import React from "react";

export const Form = ({
  fields,
  onSubmit,
  values,
  onChange,
  buttonText = "Submit",
}) => (
  <form
    className="flex flex-col gap-y-3"
    onSubmit={(e) => {
      e.preventDefault();
      onSubmit();
    }}
  >
    {fields.map((field) => (
      <input
        key={field.name}
        type={field.type}
        name={field.name}
        placeholder={field.placeholder}
        className="p-2 border rounded"
        value={values[field.name] || ""}
        onChange={onChange}
        autoComplete={field.autoComplete || "off"}
      />
    ))}
    <button
      type="submit"
      className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
    >
      {buttonText}
    </button>
  </form>
);
