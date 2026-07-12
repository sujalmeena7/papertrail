import { injectCaptureButton, ReceiptData } from './utils';

// Vercel uses client-side routing heavily
let lastUrl = location.href; 
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    onUrlChange();
  }
}).observe(document, {subtree: true, childList: true});

function onUrlChange() {
  if (location.href.includes('/billing')) {
    setTimeout(attemptInjection, 2000);
  }
}

if (location.href.includes('/billing')) {
  setTimeout(attemptInjection, 2000);
}

function attemptInjection() {
  injectCaptureButton(() => {
    try {
      const vendor = "Vercel";
      
      // Look for something that indicates "Total" or "Balance"
      const bodyText = document.body.innerText;
      
      // Look for a dollar amount in the body
      const amountMatch = bodyText.match(/\$([0-9,]+\.[0-9]{2})/i);
      if (!amountMatch) return null;
      
      const amountStr = amountMatch[1].replace(/,/g, '');
      const amountCents = Math.round(parseFloat(amountStr) * 100);
      
      // For Vercel, if we can't find a date, default to today
      const date = new Date().toISOString().split('T')[0];
      
      const data: ReceiptData = {
        vendor,
        amountCents,
        currency: "USD",
        date,
        invoiceNumber: null,
        category: "cloud" // Vercel hosting → cloud
      };
      
      return data;
    } catch (e) {
      console.error(e);
      return null;
    }
  });
}
