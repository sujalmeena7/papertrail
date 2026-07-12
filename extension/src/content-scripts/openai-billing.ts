import { injectCaptureButton, ReceiptData } from './utils';

// OpenAI uses SPAs
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
      const vendor = "OpenAI";
      
      const bodyText = document.body.innerText;
      
      const amountMatch = bodyText.match(/\$([0-9,]+\.[0-9]{2})/i);
      if (!amountMatch) return null;
      
      const amountStr = amountMatch[1].replace(/,/g, '');
      const amountCents = Math.round(parseFloat(amountStr) * 100);
      
      const dateMatch = bodyText.match(/(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+\d{4}/i);
      let date = new Date().toISOString().split('T')[0];
      if (dateMatch) {
        date = new Date(dateMatch[0]).toISOString().split('T')[0];
      }
      
      const data: ReceiptData = {
        vendor,
        amountCents,
        currency: "USD",
        date,
        invoiceNumber: null,
        category: "ai"
      };
      
      return data;
    } catch (e) {
      console.error(e);
      return null;
    }
  });
}
