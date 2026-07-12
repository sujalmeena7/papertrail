chrome.runtime.onInstalled.addListener(() => {
  console.log('Papertrail Extension Installed');
});

chrome.runtime.onMessage.addListener((request: any, sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) => {
  if (request.action === 'capture_invoice') {
    handleCapture(request.data)
      .then(() => sendResponse({ success: true }))
      .catch((error: Error) => sendResponse({ success: false, error: error.message }));
    
    return true; // Keep message channel open for async response
  }
});

async function handleCapture(data: any) {
  const storage = await chrome.storage.local.get(['device_token']);
  const token = storage.device_token;
  
  if (!token) {
    throw new Error('Please add your device token in the Papertrail extension popup.');
  }

  // TODO: Make this configurable or dynamically use production URL
  const baseUrl = 'http://localhost:3000';
  
  const res = await fetch(`${baseUrl}/api/capture`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });

  if (!res.ok) {
    let errorMsg = 'Failed to capture receipt.';
    try {
      const errData = await res.json();
      errorMsg = errData.error || errorMsg;
    } catch (e) {
      // JSON parse failed
    }
    throw new Error(errorMsg);
  }
}
