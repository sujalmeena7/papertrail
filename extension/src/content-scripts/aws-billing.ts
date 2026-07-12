import { injectCaptureButton, ReceiptData } from './utils';

// Listen for navigation in SPAs
let lastUrl = location.href; 
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    onUrlChange();
  }
}).observe(document, {subtree: true, childList: true});

function onUrlChange() {
  if (location.href.includes('/billing') || location.href.includes('/costmanagement')) {
    setTimeout(attemptInjection, 2000);
  }
}

// Initial check
if (location.href.includes('/billing') || location.href.includes('/costmanagement')) {
  setTimeout(attemptInjection, 2000);
}

function attemptInjection() {
  injectCaptureButton(() => {
    try {
      const vendor = "Amazon Web Services";
      const bodyText = document.body.innerText;
      
      // Look for typical AWS billing values
      // 1. "Month-to-date cost $40.00"
      // 2. "Total $40.00"
      const amountMatch = bodyText.match(/(?:Month-to-date cost|Total|Last month's total cost)[\s\S]{0,50}?\$([0-9,]+\.[0-9]{2})/i) || 
                          bodyText.match(/\$([0-9,]+\.[0-9]{2})/);
      
      if (!amountMatch) return null;
      
      const amountStr = amountMatch[1].replace(/,/g, '');
      const amountCents = Math.round(parseFloat(amountStr) * 100);
      
      const dateMatch = bodyText.match(/(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}/i);
      let date = new Date().toISOString().split('T')[0];
      if (dateMatch) {
        date = new Date(`${dateMatch[0]} 1`).toISOString().split('T')[0];
      }

      const data: ReceiptData = {
        vendor,
        amountCents,
        currency: "USD",
        date,
        invoiceNumber: null,
        category: "cloud"
      };
      
      return data;
    } catch (e) {
      console.error(e);
      return null;
    }
  });
}
