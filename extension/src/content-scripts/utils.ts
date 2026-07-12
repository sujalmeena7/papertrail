export interface ReceiptData {
  vendor: string;
  amountCents: number;
  currency: string;
  date: string;
  invoiceNumber: string | null;
  // Must match the /api/capture enum — that endpoint is what the extension POSTs to.
  category: "cloud" | "saas" | "ai" | "domains" | "payments" | "design" | "productivity" | "marketing" | "other";
}

/**
 * True while this content script is still connected to a live extension.
 * `chrome.runtime.id` becomes undefined once the extension is reloaded or
 * updated while the page stays open — the "Extension context invalidated" case.
 */
function isExtensionContextValid(): boolean {
  try {
    return Boolean(chrome.runtime?.id);
  } catch {
    return false;
  }
}

/** Promise wrapper around sendMessage that surfaces both the synchronous
 *  "context invalidated" throw and the async chrome.runtime.lastError. */
function sendMessage<T = any>(message: unknown): Promise<T> {
  return new Promise((resolve, reject) => {
    try {
      chrome.runtime.sendMessage(message, (response) => {
        const err = chrome.runtime.lastError;
        if (err) {
          reject(new Error(err.message ?? "Message channel closed"));
          return;
        }
        resolve(response as T);
      });
    } catch (e) {
      reject(e as Error);
    }
  });
}

export function injectCaptureButton(getData: () => ReceiptData | null) {
  // Only inject once
  if (document.getElementById('papertrail-capture-btn')) return;

  const btn = document.createElement('button');
  btn.id = 'papertrail-capture-btn';
  btn.innerText = 'Save to Papertrail';
  
  // Style the button
  Object.assign(btn.style, {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    zIndex: '999999',
    backgroundColor: '#09090b',
    color: 'white',
    padding: '12px 20px',
    borderRadius: '8px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    fontWeight: '600',
    fontSize: '14px',
    border: '1px solid #27272a',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  });

  const iconHtml = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 17.5v-11"/></svg>`;
  btn.innerHTML = `${iconHtml} Save to Papertrail`;

  btn.onmouseover = () => btn.style.transform = 'translateY(-2px)';
  btn.onmouseout = () => btn.style.transform = 'translateY(0)';

  btn.onclick = async () => {
    // If the extension was reloaded/updated, this script is orphaned and can't
    // reach the background worker. Tell the user how to recover instead of
    // throwing the cryptic "Extension context invalidated" error.
    if (!isExtensionContextValid()) {
      alert('Papertrail was updated. Please reload this page, then click "Save to Papertrail" again.');
      return;
    }

    try {
      const data = getData();
      if (!data) {
        alert('Papertrail: Could not extract receipt details from this page.');
        return;
      }

      btn.innerHTML = `<svg class="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> Saving...`;
      btn.style.opacity = '0.8';
      btn.disabled = true;

      // Send message to background script to avoid CORS issues
      const response = await sendMessage<{ success: boolean; error?: string }>({
        action: 'capture_invoice',
        data,
      });

      if (!response || !response.success) {
        alert(`Papertrail: ${response?.error || 'Failed to capture'}`);
        resetButton(btn, iconHtml);
        return;
      }

      // Success
      btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> Saved!`;
      btn.style.backgroundColor = '#f0fdf4';
      btn.style.color = '#15803d';
      btn.style.border = '1px solid #bbf7d0';

      setTimeout(() => {
        btn.remove();
      }, 3000);
    } catch (error: any) {
      console.error('Papertrail capture error:', error);
      const raw = error?.message || 'Something went wrong.';
      const friendly = /context invalidated|message channel closed|receiving end does not exist/i.test(raw)
        ? 'Papertrail was updated or reloaded. Please refresh this page and try again.'
        : raw;
      alert(`Papertrail: ${friendly}`);
      resetButton(btn, iconHtml);
    }
  };

  document.body.appendChild(btn);
}

function resetButton(btn: HTMLButtonElement, iconHtml: string) {
  btn.innerHTML = `${iconHtml} Save to Papertrail`;
  btn.style.opacity = '1';
  btn.disabled = false;
}
