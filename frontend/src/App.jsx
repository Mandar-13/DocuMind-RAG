import { useState } from "react";
import "./App.css";

// Backend address
const API = "http://localhost:3000";

export default function App() {
  const [messages, setMessages] = useState([]); // chat history shown on screen
  const [input, setInput] = useState("");       // text in the question box
  const [loading, setLoading] = useState(false); // true while waiting for Gemini

  // Send the chosen file to POST /upload
  async function upload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const form = new FormData(); // multipart form, which multer expects
    form.append("file", file);   // "file" must match upload.single("file")
    try {
      const res = await fetch(`${API}/upload`, { method: "POST", body: form });
      const data = await res.json();
      const text = data.error
        ? data.error
        : `Uploaded ${data.source} (${data.chunks} chunks)`;
      setMessages((m) => [...m, { role: "bot", text }]);
    } catch {
      setMessages((m) => [...m, { role: "bot", text: "Upload failed." }]);
    }
    e.target.value = ""; // reset the picker so the same file can be chosen again
  }

  // Send the question to POST /ask and show the reply
  async function send() {
    const question = input.trim();
    if (!question || loading) return; // ignore empty input or double sends
    setMessages((m) => [...m, { role: "user", text: question }]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch(`${API}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const data = await res.json();
      setMessages((m) => [
        ...m,
        {
          role: "bot",
          text: data.answer || data.error,
          // Hide the source when the bot said "I don't know"
          sources: data.answer?.startsWith("I don't know") ? [] : data.sources,
        },
      ]);
    } catch {
      setMessages((m) => [...m, { role: "bot", text: "Could not reach the server." }]);
    }
    setLoading(false);
  }

  return (
    <div className="chat">
      <h2>DocuMind</h2>
      {/* File picker: only .txt files are supported */}
      <input type="file" accept=".txt" onChange={upload} />
      <div className="messages">
        {messages.map((m, i) => (
          <div key={i} className={`msg ${m.role}`}>
            <p>{m.text}</p>
            {/* Show sources only when there are any; Set removes duplicates */}
            {m.sources?.length > 0 && (
              <small>Sources: {[...new Set(m.sources)].join(", ")}</small>
            )}
          </div>
        ))}
        {loading && <div className="msg bot">Thinking...</div>}
      </div>
      {/* Question box: press Enter or click Send */}
      <div className="input-row">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Ask a question about your documents"
        />
        <button onClick={send}>Send</button>
      </div>
    </div>
  );
}