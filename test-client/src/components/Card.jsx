import React from "react";

const Card = ({ title, description, children }) => (
  <div className="bg-white shadow rounded-xl p-8 flex flex-col items-center">
    <span className="text-2xl font-semibold mb-2">{title}</span>
    <span className="text-gray-500 mb-4 text-center">{description}</span>
    {children}
  </div>
);

export default Card;
