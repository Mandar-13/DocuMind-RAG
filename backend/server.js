import express from "express";
import cors from "cors";
import multer from "multer";
import { addDocument, answer } from "./rag.js";

// Multer keeps uploaded files in memory (nothing is saved to disk)
const upload = multer({ storage: multer.memoryStorage() });

const app = express();
app.use(cors());         // allow the React app (port 5173) to call this server
app.use(express.json()); // parse JSON request bodies

// POST /ask: takes a question, returns an answer and its source
app.post("/ask", async (req, res) => {
  try {
    const { question } = req.body;
    // 400 = bad request: the client forgot the question
    if (!question) return res.status(400).json({ error: "question is required" });
    res.json(await answer(question));
  } catch (err) {
    console.error(err); // log the real error on the server only
    res.status(500).json({ error: "Something went wrong" });
  }
});

// POST /upload: takes a .txt file, chunks and embeds it, stores it
app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "file is required" });
    const text = req.file.buffer.toString("utf-8"); // file bytes -> text
    const chunks = await addDocument(text, req.file.originalname);
    res.json({ source: req.file.originalname, chunks });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Upload failed" });
  }
});

app.listen(3000, () => console.log("Server running on http://localhost:3000"));