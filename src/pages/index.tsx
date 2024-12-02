import usePrompts from "@/hooks/usePrompts";
import Markdown from "markdown-to-jsx";

export default function Home() {
  const { data, fetchFile, isLoading, progress, setApiKey, error } =
    usePrompts();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    fetchFile(e.target.files![0]);
  };

  const handleApiKey = (e: React.ChangeEvent<HTMLInputElement>) => {
    setApiKey(e.target.value);
  };

  return (
    <div className="px-4 py-10 gap-8 flex flex-col">
      <div className="flex items-center flex-col px-4 gap-2">
        <h2
          className="text-2xl font-bold pb-4"
          style={{ textShadow: "2px 2px 2px #ccc" }}
        >
          Enter your file to generate MCQ questions
        </h2>

        <input
          id="apiKey"
          type="password"
          onChange={handleApiKey}
          className="border flex justify-center w-1/2 px-4 py-2"
          placeholder="Enter your Gemini API key"
        />
        <p className="text-sm text-gray-500 w-1/2 pb-2">
          Note: This API key is not stored anywhere and is only used to generate
          questions. Get your API key from{" "}
          <a
            className="text-blue-500"
            href="https://aistudio.google.com/apikey"
          >
            Gemini
          </a>
        </p>

        <input
          type="file"
          onChange={handleFileChange}
          className="border flex justify-center w-1/2"
        />
      </div>
      <div className="border rounded-md shadow-md min-h-[50vh] flex">
        {isLoading && (
          <div className="flex justify-center items-center flex-1 flex-col">
            <p>Preparing your result please wait...</p>
            <p>File Uploading Progress: {progress}%</p>
            {progress > 90 && <p>Generating questions...</p>}
          </div>
        )}
        {!isLoading && !data && !error && (
          <div className="flex justify-center items-center flex-1">
            No data available...
          </div>
        )}
        {!isLoading && !data && error && (
          <div className="flex justify-center items-center flex-1 text-red-500">
            <span className="font-bold">Error:</span> &nbsp;
            {error}
          </div>
        )}
        {!isLoading && data && (
          <Markdown
            className="p-8"
            options={{
              overrides: {
                ol: {
                  props: {
                    className: "list-decimal list-inside",
                  },
                },
                p: {
                  props: {
                    className: "px-5",
                  },
                },
              },
            }}
          >
            {data}
          </Markdown>
        )}
      </div>
    </div>
  );
}
