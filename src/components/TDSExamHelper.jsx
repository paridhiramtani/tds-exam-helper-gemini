import React, { useState } from "react";
import { CheckCircle, AlertCircle, Loader, Target } from "lucide-react";

export default function TDSExamHelper() {
  const [question, setQuestion] = useState("");
  const [files, setFiles] = useState([]);
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "";

  const handleFileChange = (e) => setFiles(Array.from(e.target.files));
  const removeFile = (idx) => setFiles((f) => f.filter((_, i) => i !== idx));

  const readFileSmart = (file) =>
    new Promise((resolve) => {
      const reader = new FileReader();
      const type = file.type || "";
      reader.onload = () => {
        if (type.includes("text") || type.includes("csv") || type.includes("json")) {
          resolve({ name: file.name, type, content: reader.result.slice(0, 100000) });
        } else {
          resolve({ name: file.name, type, content: `[File ${file.name} (${type}), base64 omitted]` });
        }
      };
      reader.readAsText(file);
    });

  const buildPrompt = async () => {
    const fileDatas = await Promise.all(files.map(readFileSmart));
    const fileSection = fileDatas.length
      ? fileDatas.map(f => `\n\nFile: ${f.name}\nType: ${f.type}\nContent:\n${f.content}`).join("\n")
      : "";
    return `QUESTION/TASK:\n${question.trim()}\n${fileSection}`;
  };

  const handleSubmit = async () => {
    setError(""); setResult("");
    if (!question.trim() && files.length === 0) {
      setError("Please enter a question and/or upload files."); return;
    }
    if (!BACKEND_URL) { setError("Backend URL not configured."); return; }
    setLoading(true);
    try {
      const prompt = await buildPrompt();
      const res = await fetch(`${BACKEND_URL}/api/gpt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt })
      });
      if (!res.ok) throw new Error(`Backend error ${res.status}`);
      const data = await res.json();
      setResult(data.output_text || "No response");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
          <h1 className="text-3xl font-bold">TDS Exam Helper (Gemini)</h1>
          <p className="text-blue-100 text-sm">Gemini-powered TDS assistant for verified solutions.</p>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Question / Task</label>
            <textarea value={question} onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g. Write a Python script to process a CSV"
              className="w-full h-28 px-4 py-3 border-2 border-gray-300 rounded-lg resize-none" />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Upload files (optional)</label>
            <input type="file" multiple onChange={handleFileChange} className="block w-full" />
            {files.length > 0 && (
              <div className="mt-2 space-y-2">
                {files.map((f, i) => (
                  <div key={i} className="flex items-center justify-between bg-gray-50 p-2 border rounded">
                    <span className="text-sm">{f.name}</span>
                    <button onClick={() => removeFile(i)} className="text-red-500 text-sm">Remove</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-3">
            <button onClick={handleSubmit} disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded">
              {loading ? <span className="flex items-center"><Loader className="animate-spin mr-2" size={16}/>Running...</span> : "Run Task"}
            </button>
            {error && <span className="text-red-600 text-sm">{error}</span>}
          </div>

          {result && (
            <div className="mt-4 bg-gray-50 border rounded p-4 whitespace-pre-wrap">
              <h3 className="font-semibold text-gray-700 mb-2 flex items-center">
                <CheckCircle className="text-green-600 mr-2" size={16}/>Result
              </h3>
              <div className="text-sm text-gray-800">{result}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

