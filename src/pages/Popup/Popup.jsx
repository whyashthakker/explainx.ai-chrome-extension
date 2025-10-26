import React, { useState, useEffect } from 'react';
import './Popup.css';

const Popup = () => {
  const [summaries, setSummaries] = useState([]);
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initializePopup = async () => {
      try {
        // Check if chrome.storage is available
        if (!chrome.storage || !chrome.storage.local) {
          throw new Error('Chrome storage API not available');
        }

        // Load initial data
        const result = await new Promise((resolve) => {
          chrome.storage.local.get(['summaries', 'hasApiKey', 'apiKey'], (data) => {
            if (chrome.runtime.lastError) {
              throw new Error(chrome.runtime.lastError.message);
            }
            resolve(data);
          });
        });

        console.log('Initial data loaded:', result); // Debug log

        if (result.summaries) {
          setSummaries(result.summaries);
        }
        setHasApiKey(!!result.hasApiKey);

        // Set up storage change listener
        const handleStorageChange = (changes, namespace) => {
          console.log('Storage changed:', changes); // Debug log
          
          if (namespace === 'local') {
            if (changes.summaries) {
              setSummaries(changes.summaries.newValue || []);
            }
            if (changes.hasApiKey) {
              setHasApiKey(!!changes.hasApiKey.newValue);
            }
          }
        };

        chrome.storage.onChanged.addListener(handleStorageChange);

        return () => {
          chrome.storage.onChanged.removeListener(handleStorageChange);
        };
      } catch (err) {
        console.error('Error initializing popup:', err);
        setError(err.message);
      }
    };

    initializePopup();
  }, []);

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) return;

    try {
      await chrome.runtime.sendMessage({
        type: 'SET_API_KEY',
        apiKey: apiKey.trim()
      });

      setHasApiKey(true);
      setShowApiKey(false);
      setApiKey('');
    } catch (error) {
      alert('Error saving API key. Please try again.');
    }
  };

  const handleRemoveApiKey = async () => {
    try {
      await chrome.storage.local.remove(['hasApiKey']);
      await chrome.runtime.sendMessage({ type: 'REMOVE_API_KEY' });
      setHasApiKey(false);
      setApiKey('');
    } catch (error) {
      alert('Error removing API key. Please try again.');
    }
  };

  const handleDeleteSummary = (index) => {
    const newSummaries = summaries.filter((_, i) => i !== index);
    chrome.storage.local.set({ summaries: newSummaries });
    setSummaries(newSummaries);
  };

  return (
    <div className="explainx-popup">
      <header className="header">
        <div className="header-main">
          <h1>Explainx</h1>
          <button 
            className="api-key-toggle"
            onClick={() => setShowApiKey(!showApiKey)}
          >
            {hasApiKey ? '🔑' : '🔒'}
          </button>
        </div>
        <p className="subtitle">Your saved summaries</p>
      </header>
      
      {error && (
        <div className="error-message">
          <p>Error: {error}</p>
          <p className="hint">Please try reloading the extension</p>
        </div>
      )}

      {showApiKey && (
        <div className="api-key-section">
          <input
            type="password"
            placeholder="Enter OpenAI API Key"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="api-key-input"
          />
          <div className="api-key-actions">
            {hasApiKey && (
              <button 
                className="btn-secondary"
                onClick={handleRemoveApiKey}
              >
                Remove Key
              </button>
            )}
            <button 
              className="btn-primary"
              onClick={handleSaveApiKey}
            >
              Save Key
            </button>
          </div>
        </div>
      )}
      
      <div className="content">
        {!error && !hasApiKey ? (
          <div className="empty-state">
            <div className="icon">🔑</div>
            <p>API Key Required</p>
            <p className="hint">Click the lock icon above to add your OpenAI API key</p>
          </div>
        ) : !error && summaries.length === 0 ? (
          <div className="empty-state">
            <div className="icon">📝</div>
            <p>No summaries yet</p>
            <p className="hint">Click the Explainx button on any webpage to create a summary</p>
            <div className="debug-info">
              <p>Storage Status: {chrome.storage ? 'Available' : 'Not Available'}</p>
              <p>Has API Key: {hasApiKey ? 'Yes' : 'No'}</p>
              <p>Summary Count: {summaries.length}</p>
            </div>
          </div>
        ) : (
          <div className="summaries-list">
            {summaries.map((summary, index) => (
              <div key={index} className="summary-card">
                <h3 className="title">{summary.title}</h3>
                <p className="url">{summary.url}</p>
                <p className="preview">{summary.content.substring(0, 150)}...</p>
                <div className="actions">
                  <button 
                    className="btn-secondary"
                    onClick={() => handleDeleteSummary(index)}
                  >
                    Delete
                  </button>
                  <button className="btn-primary">View</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Popup;
