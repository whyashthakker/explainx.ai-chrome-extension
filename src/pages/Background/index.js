import OpenAI from 'openai';

// Initialize OpenAI client
let openai = null;

// Function to initialize OpenAI client with API key
async function initializeOpenAI() {
  try {
    const result = await chrome.storage.local.get(['apiKey']);
    if (result.apiKey) {
      openai = new OpenAI({
        apiKey: result.apiKey,
        dangerouslyAllowBrowser: true // Required for browser environment
      });
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error initializing OpenAI client:', error);
    return false;
  }
}

// Function to generate summary using OpenAI
async function generateSummary(text) {
  if (!openai) {
    throw new Error('OpenAI client not initialized. Please set API key first.');
  }

  try {
    const prompt = `Please provide a concise summary of the following text. Focus on the main points and key takeaways:\n\n${text}`;
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that creates concise and accurate summaries of web content."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 500,
      temperature: 0.7
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error('Error generating summary:', error);
    throw error;
  }
}

// Handle messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'GENERATE_SUMMARY') {
    generateSummary(request.data.content)
      .then(summary => {
        sendResponse({ success: true, summary });
      })
      .catch(error => {
        sendResponse({ success: false, error: error.message });
      });
    return true; // Required for async response
  }

  if (request.type === 'SET_API_KEY') {
    chrome.storage.local.set({
      apiKey: request.apiKey,
      hasApiKey: true
    }, async () => {
      if (chrome.runtime.lastError) {
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
        return;
      }
      try {
        const initialized = await initializeOpenAI();
        sendResponse({ success: initialized });
      } catch (error) {
        sendResponse({ success: false, error: error.message });
      }
    });
    return true;
  }

  if (request.type === 'REMOVE_API_KEY') {
    chrome.storage.local.remove(['apiKey', 'hasApiKey'], () => {
      if (chrome.runtime.lastError) {
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
        return;
      }
      openai = null;
      sendResponse({ success: true });
    });
    return true;
  }

  if (request.type === 'SAVE_SUMMARY') {
    chrome.storage.local.get(['summaries'], (result) => {
      const summaries = result.summaries || [];
      summaries.unshift(request.data);
      chrome.storage.local.set({ summaries }, () => {
        sendResponse({ success: true });
      });
    });
    return true;
  }
});
