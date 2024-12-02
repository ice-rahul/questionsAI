import { useEffect, useState } from "react";

// Debounce function to delay the execution of the function
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function debounce(fn: any, delay: number) {
  let timeoutId: NodeJS.Timeout;

  // @ts-expect-error type unknown
  return function (...args) {
    // Clear the previous timeout to reset the delay
    clearTimeout(timeoutId);

    // Set a new timeout to execute the function after the delay
    timeoutId = setTimeout(() => {
      fn(...args);
    }, delay);
  };
}

function usePrompts() {
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);
  // optimising the function call to avoid multiple calls
  const fetchFile = debounce(setFile, 500);

  useEffect(() => {
    // donot fetch if file is empty
    if (!file || !apiKey) return;

    setLoading(true);
    setError("");

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/prompt", true);
    const formData = new FormData();
    formData.append("file", file!);
    formData.append("apiKey", apiKey);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percentage = Math.round((event.loaded * 100) / event.total);
        setProgress(percentage);
      }
    };

    xhr.onload = () => {
      if (xhr.status === 200) {
        setProgress(0);
        const response = JSON.parse(xhr.responseText);
        const { data } = response;
        setResult(data); // Update result state with API response
      } else {
        const response = JSON.parse(xhr.responseText);
        setError(response.message);
      }
      setLoading(false);
    };

    xhr.onerror = () => {
      alert("An error occurred while uploading.");
      setLoading(false);
    };

    xhr.send(formData);
  }, [file, apiKey]);

  return {
    data: result,
    fetchFile,
    setApiKey,
    isLoading: loading,
    progress,
    error,
  };
}

export default usePrompts;
