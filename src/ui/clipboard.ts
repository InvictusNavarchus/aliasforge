const copyToast = document.getElementById('copy-toast') as HTMLElement;

let toastTimer: ReturnType<typeof setTimeout> | null = null;

function showToast(msg: string): void {
  copyToast.textContent = msg;
  copyToast.classList.add('visible');
  if (toastTimer !== null) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => copyToast.classList.remove('visible'), 1800);
}

async function copy(text: string, btn: HTMLButtonElement): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;opacity:0;pointer-events:none;';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  }

  btn.textContent = 'Copied';
  btn.classList.add('copied');
  showToast(`Copied: ${text}`);

  setTimeout(() => {
    btn.textContent = 'Copy';
    btn.classList.remove('copied');
  }, 1500);
}

export const Clipboard = { copy, showToast } as const;
