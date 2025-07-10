import React from "react";

const Heading = ({ children, className }) => {
  return <h1 className={`text-4xl font-bold ${className}`}>{children}</h1>;
};

export default Heading;
