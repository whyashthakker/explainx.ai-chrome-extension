// Create and inject the floating button
function createFloatingButton() {
  const button = document.createElement('button');
  button.id = 'explainx-button';
  button.innerHTML = '📝';
  button.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    width: 50px;
    height: 50px;
    border-radius: 25px;
    background: #ffffff;
    border: 2px solid #e2e8f0;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    cursor: pointer;
    z-index: 10000;
    font-size: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
  `;

  button.addEventListener('mouseover', () => {
    button.style.transform = 'scale(1.1)';
  });

  button.addEventListener('mouseout', () => {
    button.style.transform = 'scale(1)';
  });

  document.body.appendChild(button);
  return button;
}

// Create and inject the dialog
function createDialog() {
  const dialog = document.createElement('div');
  dialog.id = 'explainx-dialog';
  dialog.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 600px;
    max-height: 80vh;
    background: #ffffff;
    border-radius: 8px;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    z-index: 10001;
    display: none;
    flex-direction: column;
    overflow: hidden;
  `;

  const header = document.createElement('div');
  header.style.cssText = `
    padding: 1rem;
    border-bottom: 1px solid #e2e8f0;
    display: flex;
    justify-content: space-between;
    align-items: center;
  `;
  header.innerHTML = '<h2 style="margin: 0; font-size: 1.25rem;">Page Content</h2>';

  const closeButton = document.createElement('button');
  closeButton.innerHTML = '✕';
  closeButton.style.cssText = `
    background: none;
    border: none;
    font-size: 1.25rem;
    cursor: pointer;
    padding: 0.5rem;
    color: #4a5568;
  `;
  header.appendChild(closeButton);

  const content = document.createElement('div');
  content.style.cssText = `
    padding: 1rem;
    overflow-y: auto;
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  `;

  const originalContent = document.createElement('div');
  originalContent.style.cssText = `
    display: none;
  `;

  const summaryContent = document.createElement('div');
  summaryContent.style.cssText = `
    white-space: pre-wrap;
    line-height: 1.6;
  `;

  const loadingSpinner = document.createElement('div');
  loadingSpinner.style.cssText = `
    display: none;
    align-items: center;
    justify-content: center;
    padding: 2rem;
  `;
  loadingSpinner.innerHTML = `
    <div style="
      width: 40px;
      height: 40px;
      border: 3px solid #f3f3f3;
      border-top: 3px solid #3b82f6;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    "></div>
    <style>
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    </style>
  `;

  const noApiKeyMessage = document.createElement('div');
  noApiKeyMessage.style.cssText = `
    display: none;
    flex-direction: column;
    gap: 1rem;
    align-items: center;
    padding: 2rem;
    text-align: center;
  `;
  noApiKeyMessage.innerHTML = `
    <p style="margin: 0; color: #4a5568;">OpenAI API key is required for generating summaries</p>
    <p style="margin: 0; color: #718096; font-size: 0.875rem;">Click the extension icon and use the 🔒 button to add your API key</p>
  `;

  content.appendChild(originalContent);
  content.appendChild(summaryContent);
  content.appendChild(loadingSpinner);
  content.appendChild(noApiKeyMessage);

  const actions = document.createElement('div');
  actions.style.cssText = `
    padding: 1rem;
    border-top: 1px solid #e2e8f0;
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
  `;

  const buttonStyles = `
    padding: 0.5rem 1rem;
    border-radius: 0.375rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  `;

  const regenerateButton = document.createElement('button');
  regenerateButton.innerHTML = 'Regenerate';
  regenerateButton.style.cssText = buttonStyles + `
    background: white;
    color: #4a5568;
    border: 1px solid #e2e8f0;
  `;

  const saveButton = document.createElement('button');
  saveButton.innerHTML = 'Save';
  saveButton.style.cssText = buttonStyles + `
    background: #3b82f6;
    color: white;
    border: none;
  `;

  const discardButton = document.createElement('button');
  discardButton.innerHTML = 'Discard';
  discardButton.style.cssText = buttonStyles + `
    background: white;
    color: #4a5568;
    border: 1px solid #e2e8f0;
  `;

  actions.appendChild(discardButton);
  actions.appendChild(regenerateButton);
  actions.appendChild(saveButton);

  dialog.appendChild(header);
  dialog.appendChild(content);
  dialog.appendChild(actions);
  document.body.appendChild(dialog);

  return {
    dialog,
    content,
    closeButton,
    saveButton,
    discardButton,
    regenerateButton,
    originalContent,
    summaryContent,
    loadingSpinner,
    noApiKeyMessage
  };
}

// Extract page content
function getPageContent() {
  // Get all text from the page body, excluding scripts and styles
  const content = document.body.innerText;
  return content;
}

// Initialize the extension
async function generateAISummary(text, { originalContent, summaryContent, loadingSpinner }) {
  loadingSpinner.style.display = 'flex';
  summaryContent.style.display = 'none';
  originalContent.style.display = 'none';

  try {
    const response = await chrome.runtime.sendMessage({
      type: 'GENERATE_SUMMARY',
      data: { content: text }
    });

    if (response.success) {
      summaryContent.textContent = response.summary;
      summaryContent.style.display = 'block';
    } else {
      if (response.error.includes('API key')) {
        return 'API_KEY_NEEDED';
      }
      throw new Error(response.error);
    }
  } catch (error) {
    console.error('Error generating summary:', error);
    summaryContent.textContent = 'Error generating summary. Please try again.';
    summaryContent.style.display = 'block';
  } finally {
    loadingSpinner.style.display = 'none';
  }
}

function init() {
  const button = createFloatingButton();
  const { 
    dialog, 
    content, 
    closeButton, 
    saveButton, 
    discardButton, 
    regenerateButton,
    originalContent,
    summaryContent,
    loadingSpinner,
    noApiKeyMessage
  } = createDialog();

  let currentPageContent = '';

  // Button click handler
  button.addEventListener('click', async () => {
    currentPageContent = getPageContent();
    originalContent.textContent = currentPageContent;
    dialog.style.display = 'flex';

    // Check if API key is set
    chrome.storage.local.get(['hasApiKey'], async (storageResult) => {
      if (!storageResult.hasApiKey) {
        noApiKeyMessage.style.display = 'flex';
        return;
      }

      const summaryResult = await generateAISummary(currentPageContent, {
        originalContent,
        summaryContent,
        loadingSpinner
      });

      if (summaryResult === 'API_KEY_NEEDED') {
        noApiKeyMessage.style.display = 'flex';
      }
    });
  });

  // Close dialog handlers
  const closeDialog = () => {
    dialog.style.display = 'none';
    summaryContent.textContent = '';
    noApiKeyMessage.style.display = 'none';
  };

  closeButton.addEventListener('click', closeDialog);
  discardButton.addEventListener('click', closeDialog);

  // Regenerate handler
  regenerateButton.addEventListener('click', async () => {
    await generateAISummary(currentPageContent, {
      originalContent,
      summaryContent,
      loadingSpinner
    });
  });
  
  // Save handler
  saveButton.addEventListener('click', async () => {
    try {
      // Get existing summaries
      const result = await chrome.storage.local.get(['summaries']);
      const summaries = result.summaries || [];
      
      // Add new summary to the beginning of the array
      const newSummary = {
        url: window.location.href,
        title: document.title,
        content: summaryContent.textContent || currentPageContent,
        date: new Date().toISOString()
      };
      
      summaries.unshift(newSummary);
      
      // Save updated summaries
      await chrome.storage.local.set({ summaries });
      closeDialog();
    } catch (error) {
      console.error('Error saving summary:', error);
      alert('Error saving summary. Please try again.');
    }
  });

  // Close dialog when clicking outside
  document.addEventListener('click', (e) => {
    if (dialog.style.display === 'flex' && 
        !dialog.contains(e.target) && 
        !button.contains(e.target)) {
      closeDialog();
    }
  });
}

// Initialize when the DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
