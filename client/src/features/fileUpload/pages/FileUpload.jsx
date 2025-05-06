import React, { useState } from "react";
import axios from "axios";
import { useAuth } from "../../../shared/contexts/AuthContext";

const FileUpload = () => {
  const { currentUser } = useAuth();
  const [skipItems, setSkipItems] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [fileError, setFileError] = useState("");

  const handleAddItem = (e) => {
    e.preventDefault();
    if (inputValue.trim()) {
      setSkipItems([...skipItems, inputValue]);
      setInputValue("");
    }
  };

  const handleRemoveItem = (item) => {
    setSkipItems(skipItems.filter((skipItem) => skipItem !== item));
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      alert("Please login to upload files");
      return;
    }

    const file = e.target.file.files[0];
    if (!file) {
      setFileError("Please select a file");
      return;
    }

    if (
      file.type !== "text/x-python" &&
      file.type !== "application/x-python-code"
    ) {
      setFileError("Only Python files are allowed.");
      return;
    }

    const formData = new FormData();
    formData.append("file", e.target.file.files[0]);
    formData.append("skip_list", JSON.stringify(skipItems));

    try {
      await axios.post(
        `${import.meta.env.VITE_API_ENDPOINT}/api/users/${
          currentUser.uid
        }/files`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      alert("File uploaded successfully");
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Error uploading file");
    }
  };

  return (
    <>
      <main className="flex flex-row w-full h-full font-funnel-sans">
        <section className="flex flex-col items-center justify-center w-1/2 h-full p-20">
          <form
            onSubmit={handleFileUpload}
            className="flex flex-col items-center justify-center space-y-10"
          >
            <label
              htmlFor="file"
              className="text-[2rem] font-bold font-funnel-display text-sky-700"
            >
              Upload your Python file
            </label>
            <input
              type="file"
              id="file"
              name="file"
              accept=".py"
              className="border border-gray-400 p-5 rounded-lg hover:bg-gray-200"
            />
            <button
              type="submit"
              className="bg-yellow-400 text-sky-700 px-5 py-2 rounded-lg font-medium
                         transform hover:scale-105 transition duration-300 ease-in-out hover:bg-yellow-500 
                         hover:shadow-lg"
            >
              Upload
            </button>
          </form>
          {fileError && (
            <p className="text-red-500 mt-5 text-center">{fileError}</p>
          )}
        </section>
        <section className="flex flex-col items-center justify-center w-1/2 h-full p-20">
          <form
            onSubmit={handleAddItem}
            className="flex flex-col items-center justify-center space-y-10"
          >
            <label
              htmlFor="skipItem"
              className="text-[2rem] font-bold font-funnel-display text-sky-700"
            >
              Enter function/class names to skip
            </label>
            <p className="w-3/4 text-center">
              Case-insensitive but include underscores or dashes if it does
              include them.{" "}
              <span className="font-medium">eg. add_item, delete-item</span>
            </p>
            <input
              type="text"
              id="skipItem"
              placeholder="Function/Class"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="border-b border-gray-400 w-1/3 p-2 focus:outline-none focus:border-b-2 focus:w-1/2 transition-all duration-100"
            />
            <button
              type="submit"
              className="bg-yellow-400 text-sky-700 px-5 py-2 rounded-lg font-medium
                         transform hover:scale-105 transition duration-300 ease-in-out hover:bg-yellow-500 
                         hover:shadow-lg"
            >
              Add
            </button>
          </form>
          <ul className="mt-10">
            {skipItems.map((item, index) => (
              <li
                key={index}
                className="flex items-center justify-between w-full p-2 border-b border-gray-300"
              >
                <span>{item}</span>
                <button
                  onClick={() => handleRemoveItem(item)}
                  className="ml-5 text-red-500 hover:text-red-700 cursor-pointer transition duration-300"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </>
  );
};

export default FileUpload;
