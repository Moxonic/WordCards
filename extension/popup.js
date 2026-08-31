function send(msg) {
  return chrome.runtime.sendMessage(msg);
}

function fmtTime(ts) {
  if (!ts) return '–';
  const d = new Date(ts);
  const diff = Date.now() - ts;
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.round(diff / 60_000)} min ago`;
  return d.toLocaleString();
}

function render(status) {
  const authArea = document.getElementById('authArea');
  authArea.innerHTML = '';

  if (status.signedIn) {
    const who = document.createElement('div');
    who.textContent = `Signed in as ${status.email || 'your account'}`;
    const out = document.createElement('button');
    out.textContent = 'Sign out';
    out.title = 'Disconnect this extension from your WordCards account';
    out.style.marginTop = '8px';
    out.onclick = async () => {
      out.disabled = true;
      render(await send({ type: 'SIGN_OUT' }));
    };
    authArea.append(who, out);
  } else {
    const p = document.createElement('div');
    p.className = 'muted';
    p.textContent = 'Sign in with the same Google account you use in WordCards.';
    const btn = document.createElement('button');
    btn.className = 'primary';
    btn.textContent = 'Sign in with Google';
    btn.title = 'Sign in with the same Google account you use in the WordCards app';
    btn.onclick = async () => {
      btn.disabled = true;
      btn.textContent = 'Signing in…';
      try {
        render(await send({ type: 'SIGN_IN' }));
      } catch (e) {
        btn.disabled = false;
        btn.textContent = 'Sign in with Google';
        showError(e.message);
      }
    };
    authArea.append(p, btn);
  }

  document.getElementById('lastSync').textContent = fmtTime(status.lastSyncAt);
  document.getElementById('lastAdded').textContent = String(status.lastAddedCount ?? 0);
  document.getElementById('total').textContent = String(status.totalSynced ?? 0);

  const pendingRow = document.getElementById('pendingRow');
  pendingRow.hidden = !status.pending;
  document.getElementById('pending').textContent = String(status.pending || 0);

  const autoSync = document.getElementById('autoSync');
  autoSync.checked = status.autoSync !== false;

  const err = document.getElementById('error');
  if (status.lastError) {
    err.hidden = false;
    err.textContent = status.lastError;
  } else {
    err.hidden = true;
  }
}

function showError(text) {
  const err = document.getElementById('error');
  err.hidden = false;
  err.textContent = text;
}

document.getElementById('autoSync').addEventListener('change', async (e) => {
  render(await send({ type: 'SET_AUTOSYNC', value: e.target.checked }));
});

document.getElementById('scanBtn').addEventListener('click', async () => {
  const btn = document.getElementById('scanBtn');
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.url || !tab.url.startsWith('https://translate.google.com/')) {
    showError('Open a translate.google.com tab first.');
    return;
  }
  btn.disabled = true;
  btn.textContent = 'Scanning…';
  try {
    const res = await chrome.tabs.sendMessage(tab.id, { type: 'SCAN_PAGE' });
    btn.textContent = res?.found ? `Sent ${res.found} row(s)` : 'No rows found on page';
  } catch (e) {
    showError('Could not reach the page. Reload the Translate tab and retry.');
    btn.textContent = 'Scan this page now';
  } finally {
    setTimeout(async () => {
      btn.disabled = false;
      btn.textContent = 'Scan this page now';
      render(await send({ type: 'GET_STATUS' }));
    }, 1500);
  }
});

(async () => {
  render(await send({ type: 'GET_STATUS' }));
})();
