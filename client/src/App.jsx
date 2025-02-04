import { useState } from "react";
import PythonLogo from "./assets/python_logo.svg";
import { FaArrowRight } from "react-icons/fa6";

function App() {
  return (
    <>
      <main className="flex flex-row w-full h-full">
        <section className="flex flex-col w-1/2 h-full items-center justify-center">
          <img src={PythonLogo} alt="" className="w-1/2 h-1/2" />
          <h1 className="text-[6rem] capitalize font-bold font-roboto leading-23 text-dark-blue">
            Documentation, <br />
            made easier.
          </h1>
        </section>
        <section className="flex flex-col w-1/2 h-full items-center justify-center space-y-5">
          <p className="w-1/2 text-[2rem] font-roboto font-semibold text-dark-blue text-center leading-9">
            Seamlessly create comprehensive documentation for your Python
            project with our AI-driven tool.
          </p>
          <button className="w-1/3 bg-yellow-500 text-white font-bold font-roboto text-[1.5rem] py-3 mt-5 rounded-lg flex items-center justify-center space-x-2 hover:bg-yellow-600 animate-bounce">
            <span>Get Started</span>
            <FaArrowRight />
          </button>
        </section>
      </main>
    </>
  );
}

export default App;
