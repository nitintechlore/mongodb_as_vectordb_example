import { Ollama } from 'ollama'

// Function to query Ollama API
export async function generateResponseWithOllama(prompt) {

  const ollama = new Ollama({ host: 'http://localhost:11434' })
    const response = await ollama.generate({
      model: 'llama3.2:1b',
      prompt: prompt
    })
    return response.response;

}
