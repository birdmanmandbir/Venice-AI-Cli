import OpenAI from "openai";
import readline from 'readline';

// Define types for our chat history
type Role = "system" | "user" | "assistant";
interface ChatMessage {
  role: Role;
  content: string;
}

const openai = new OpenAI({
  apiKey: process.env.API_KEY,
  baseURL: process.env.BASE_URL,
});

// Create readline interface for command line input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to list available models
async function listModels(): Promise<OpenAI.Models.Model[]> {
  try {
    const response = await openai.models.list();
    console.log('\nAvailable models:');
    response.data.forEach((model, index) => {
      console.log(`${index + 1}. ${model.id}`);
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching models:', error instanceof Error ? error.message : 'Unknown error');
    return [];
  }
}

// Function to chat with the model
async function chat(modelId: string): Promise<void> {
  const chatHistory: ChatMessage[] = [
    { role: "system", content: "You are a helpful assistant." }
  ];

  const askQuestion = (): void => {
    rl.question('\nYou: ', async (userInput: string) => {
      if (userInput.trim().toLowerCase() === '\\bye') {
        console.log('Goodbye!');
        rl.close();
        return;
      }

      try {
        chatHistory.push({ role: "user", content: userInput });
        const response = await openai.chat.completions.create({
          model: modelId,
          messages: chatHistory,
        });

        const assistantResponse = response.choices[0].message.content;
        if (assistantResponse === null) {
          throw new Error('Received null response from assistant');
        }

        console.log('\nAssistant:', assistantResponse);
        chatHistory.push({ role: "assistant", content: assistantResponse });
        
        // Continue the conversation
        askQuestion();
      } catch (error) {
        console.error('Error in chat:', error instanceof Error ? error.message : 'Unknown error');
        askQuestion();
      }
    });
  };

  console.log('\nChat started! Type \\bye to exit.');
  askQuestion();
}

// Main function to run the program
async function main(): Promise<void> {
  const models = await listModels();
  if (models.length === 0) return;

  rl.question('\nEnter the number of the model you want to chat with: ', async (answer: string) => {
    const modelIndex = parseInt(answer) - 1;
    if (modelIndex >= 0 && modelIndex < models.length) {
      await chat(models[modelIndex].id);
    } else {
      console.log('Invalid model number');
      rl.close();
    }
  });
}

// Run the program
main().catch((error) => {
  console.error('Fatal error:', error instanceof Error ? error.message : 'Unknown error');
  process.exit(1);
}); 