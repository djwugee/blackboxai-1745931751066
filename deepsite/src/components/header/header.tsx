import { ReactNode, useState, useEffect } from "react";
import { MdAdd } from "react-icons/md";

function Header({
  onReset,
  children,
  selectedModel,
  setSelectedModel,
}: {
  onReset: () => void;
  children?: ReactNode;
  selectedModel: string;
  setSelectedModel: (model: string) => void;
}) {
  const [models, setModels] = useState<string[]>([]);

  useEffect(() => {
    // Fetch available models from backend
    fetch("/api/models")
      .then((res) => res.json())
      .then((data) => {
        const modelNames = data.map((model: any) => model.name);
        setModels(modelNames);
        if (modelNames.length > 0 && !selectedModel) {
          setSelectedModel(modelNames[0]);
        }
      })
      .catch(() => {
        setModels([]);
      });
  }, [selectedModel, setSelectedModel]);

  return (
    <header className="border-b border-gray-900 bg-gray-950 px-3 lg:px-6 py-2 flex justify-between items-center sticky top-0 z-20">
      <div className="flex items-center justify-start gap-3">
        <h1 className="text-white text-lg lg:text-xl font-bold flex items-center justify-start">
          <span className="text-pink-500 mr-2 text-2xl">🤖</span>
          AI Web Builder
        </h1>
        <p className="text-gray-700 max-md:hidden">|</p>
        <button
          className="max-md:hidden relative cursor-pointer flex-none flex items-center justify-center rounded-md text-xs font-semibold leading-4 py-1.5 px-3 hover:bg-gray-700 text-gray-100 shadow-sm dark:shadow-highlight/20 bg-gray-800"
          onClick={onReset}
        >
          <MdAdd className="mr-1 text-base" />
          New
        </button>
        <p className="text-gray-500 text-sm max-md:hidden">
          Build websites with AI in seconds
        </p>
        <select
          className="bg-pink-600 text-white rounded px-3 py-2 ml-4 font-semibold text-sm shadow-lg shadow-pink-500/50 hover:bg-pink-500 transition-colors duration-200"
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          title="Select AI Model"
        >
          {models.map((model) => (
            <option key={model} value={model}>
              {model}
            </option>
          ))}
        </select>
      </div>
      {children}
    </header>
  );
}

export default Header;
