# DocuMind: RAG Document Q&A Assistant

Upload text documents and ask questions about them in a chat UI. Answers come only from your documents, with the source file shown. If the answer isn't in the documents, the app says "I don't know".

## How it works
1. **Upload:** a document is split into overlapping chunks, and each chunk is converted to an embedding with the Gemini API.
2. **Ask:** the question is embedded, and the top 3 most similar chunks are found with cosine similarity.
3. **Answer:** the chunks and the question go to Gemini with a prompt that restricts it to that context.

## Tech stack
Node.js, Express, React (Vite), Gemini API (embeddings and answers), Multer, Jest

## Run locally
1. Get a free Gemini API key at https://aistudio.google.com/apikey

2. Backend:
```bash
cd backend
npm install
echo "GEMINI_API_KEY=your_key_here" > .env
node server.js
```

3. Frontend (in a second terminal):
```bash
cd frontend
npm install
npm run dev
```

4. Open http://localhost:5173, upload `backend/policy.txt` and `backend/about.txt`, and ask questions.

## API
- `POST /upload`: upload a `.txt` file (form field `file`)
- `POST /ask`: body `{ "question": "..." }`, returns `{ answer, sources }`

## Tests
```bash
cd backend
npm test
```

## Limitations
Documents are stored in memory and reset when the server restarts. Only `.txt` files are supported. A vector database and PDF support would be the next improvements.