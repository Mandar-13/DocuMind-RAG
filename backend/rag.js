// Load the .env file so process.env.GEMINI_API_KEY works
import "dotenv/config";
import { GoogleGenAI } from "@google/genai";

// Gemini client, authenticated with the key from .env
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Split text into overlapping pieces (chunks)
export function chunkText(text, size = 800, overlap = 100) {
  const chunks = [];
  // Move forward 700 chars each time (800 - 100), so chunks overlap by 100
  for (let i = 0; i < text.length; i += size - overlap) {
    const chunk = text.slice(i, i + size).trim();
    if (chunk) chunks.push(chunk); // skip empty chunks
  }
  return chunks;
}

// Turn texts into embeddings (lists of numbers that capture meaning)
export async function embed(texts) {
  const out = [];
  // Send 50 texts per request to stay within API limits
  for (let i = 0; i < texts.length; i += 50) {
    const res = await ai.models.embedContent({
      model: "gemini-embedding-001",
      contents: texts.slice(i, i + 50),
    });
    out.push(...res.embeddings.map((e) => e.values));
  }
  return out;
}

// Similarity score between two embeddings: near 1 = similar meaning
export function cosine(a, b) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]; // how much the two vectors point the same way
    na += a[i] * a[i];  // squared length of a
    nb += b[i] * b[i];  // squared length of b
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

// In-memory storage (resets on server restart)
const store = []; // each item: { text, source, embedding }

// Chunk a document, embed the chunks, and save them with the file name
export async function addDocument(text, source) {
  const chunks = chunkText(text);
  const embeddings = await embed(chunks);
  chunks.forEach((c, i) => {
    store.push({ text: c, source, embedding: embeddings[i] });
  });
  return chunks.length;
}

// Retrieval: find the k chunks closest in meaning to the query
export async function search(query, k = 3) {
  const [qEmb] = await embed([query]); // embed the question
  return store
    .map((item) => ({
      text: item.text,
      source: item.source,
      score: cosine(qEmb, item.embedding), // score every stored chunk
    }))
    .sort((a, b) => b.score - a.score) // best score first
    .slice(0, k);                      // keep the top k
}

// Full RAG: retrieve chunks, then ask Gemini to answer from them
export async function answer(question) {
  const hits = await search(question);
  // Number each chunk and label it with its source file
  const context = hits
    .map((h, i) => `[${i + 1}] (${h.source}) ${h.text}`)
    .join("\n\n");

  // The prompt restricts Gemini to the context (this reduces hallucination)
  const prompt = `Answer the question using ONLY the context below.
If the answer is not in the context, say "I don't know based on the provided documents."

Context:
${context}

Question: ${question}`;

  const res = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  });

  // Return the answer plus only the best-matching source file
  return { answer: res.text, sources: [hits[0]?.source].filter(Boolean) };
}