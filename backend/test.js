import { addDocument, answer } from "./rag.js";

await addDocument(
  "Our refund policy allows returns within 30 days of purchase with a receipt. Shipping takes 5 to 7 business days.",
  "policy.txt"
);
await addDocument(
  "Customer support is available Monday to Friday, 9am to 6pm IST. Email support@example.com.",
  "support.txt"
);

console.log(await answer("How long do I have to return an item?"));
console.log(await answer("Who is the CEO of the company?"));