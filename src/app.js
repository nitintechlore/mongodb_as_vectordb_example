import { MongoDBAtlasVectorSearch } from "@langchain/mongodb";
import { OllamaEmbeddings } from "@langchain/ollama";
import { MongoClient } from "mongodb";
import { Document } from "@langchain/core/documents";
import { generateResponseWithOllama } from './ollamaClient.js';
import sampleData from '../data/sampleData.json' assert { type: 'json' };

const MONGODB_ATLAS_URI = "mongodb+srv://nitinkokane:ZtwE5C1P8fZVHJsL@cluster0.2xb2t.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const MONGODB_ATLAS_DB_NAME = "sample_vector_db";
const MONGODB_ATLAS_COLLECTION_NAME = "sample_vector_collection";

const client = new MongoClient(MONGODB_ATLAS_URI);

const collection = client
  .db(MONGODB_ATLAS_DB_NAME)
  .collection(MONGODB_ATLAS_COLLECTION_NAME);

//Note - mxbai-embed-large uses 1024 dimensions, nomic-embed-text uses 768 dimensions 
//according we will need to create vector index on collection 
const embeddings = new OllamaEmbeddings({
  model: "mxbai-embed-large", //"nomic-embed-text"   - 
  baseUrl: "http://localhost:11434", // Default value
});

const vectorStore = new MongoDBAtlasVectorSearch(embeddings, {
  collection: collection,
  indexName: "vector_index", // The name of the Atlas search index. Defaults to "default"
  textKey: "text", // The name of the collection field containing the raw content. Defaults to "text"
  embeddingKey: "embedding", // The name of the collection field containing the embedded text. Defaults to "embedding"
});


//Initialize mongodb with data (run once or only when needed
/*const documents = sampleData.map((doc, index) => (
  new Document({
    id: doc.id || `id${index + 1}`,  // Use provided ID or default to sequential IDs
    pageContent: doc.pageContent,
    metadata: doc.metadata
  })
));

await vectorStore.addDocuments(documents);
*/


//const userInput = "Which ocean is the largest and deepest on Earth?";
//const userInput = "Where will the 2024 Olympics be held?";
const userInput = "about Raghvind's academics";

try {

  // Step 1: Retrieve context from mongodb
  const similaritySearchResults = await vectorStore.similaritySearch(
    //"biology",
    userInput,
    2//2
  );

  //console.log(similaritySearchResults);
  /*for (const doc of similaritySearchResults) {
    console.log(`* ${doc.pageContent} [${JSON.stringify(doc.metadata, null)}]`);
  }*/

  let contextText = '';
  for (const doc of similaritySearchResults) {
    contextText = contextText + doc.pageContent + ".";
  }
  console.log("contextText: " + contextText);

  // Step 2: Format the prompt with retrieved context 
  const formattedPrompt = `Based on the provided context: \n ${contextText} \nAnswer the question: ${userInput}  \n  Provide only the response text directly related to the question.`;

  // Step 3: Generate response with Ollama
  const response = await generateResponseWithOllama(formattedPrompt);

  console.log("\n\nFinal Answer :" + response);

} catch (error) {
  console.error("An error occurred:", error);
} finally {
  // to close the client instance
  // await client.close();
}