import React from "react";
import { Link } from "react-router-dom";
import { GiThreeFriends } from "react-icons/gi";
import { IoBookSharp } from "react-icons/io5";
import { MdEmail } from "react-icons/md";

const Header = () => {
  return (
    <>
      <header className="flex flex-row w-full h-full bg-blue-900 p-10 text-white">
        <div className="flex flex-row items-center w-1/2 h-full">
          <Link to="/" className="text-4xl font-bold font-roboto ">
            Exceptionals
          </Link>
        </div>
        <div className="flex items-center w-1/2 h-full">
          <ul className="flex flex-row w-full h-full items-center justify-end space-x-5 text-black font-roboto">
            <li>
              <Link
                to="/about"
                className="flex flex-row items-center space-x-3 px-5 py-3 bg-white rounded-lg hover:bg-gray-200 hover:scale-105"
              >
                <GiThreeFriends className="text-2xl text-yellow-500" />
                <span className="text-lg font-semibold font-open-sans">
                  About Us
                </span>
              </Link>
            </li>
            <li>
              <Link
                to="/guide"
                className="flex flex-row items-center space-x-3 px-5 py-3 bg-white rounded-lg hover:bg-gray-200 hover:scale-105"
              >
                <IoBookSharp className="text-2xl text-yellow-500" />
                <span className="text-lg font-semibold font-open-sans">
                  Guide
                </span>
              </Link>
            </li>
            <li>
              <Link
                to="/contact"
                className="flex flex-row items-center space-x-3 px-5 py-3 bg-white rounded-lg hover:bg-gray-200 hover:scale-105"
              >
                <MdEmail className="text-2xl text-yellow-500" />
                <span className="text-lg font-semibold font-open-sans">
                  Contact Us
                </span>
              </Link>
            </li>
          </ul>
        </div>
      </header>
    </>
  );
};

export default Header;
