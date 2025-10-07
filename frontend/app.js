/*
  Frontend JS for StoryChain MVP.
  - Creates a new chain and submits contributions
  - Shows the generated paragraph when done
  - Contains a MetaMask-based "Donate" button (client-side crypto payments)

  IMPORTANT: The crypto donation uses window.ethereum. MetaMask must be installed in the user's browser.
  The receiver address is taken from backend .env (exposed via environment) — for this MVP we hardcode a placeholder.
  Replace RECEIVER_ADDRESS_PLACEHOLDER with your wallet address in frontend/app.js or dynamically fetch from the backend.
*/

// Replace this with your receiver address or fetch from backend (for demo, it's a placeholder)
let RECEIVER_ADDRESS = null;
// ===== config =====
const API_BASE = 'https://storychain-4.onrender.com';  // <- change to your backend URL
let RECEIVER_ADDRESS = '0x510D84Ccfd47fF2cD5dd86Dd34c601293a42cab3';                        // <- your wallet

// Fetch receiver address from backend to avoid hardcoding in frontend
async function fetchConfig() {
  try {
    const resp = await fetch(API_BASE + '/api/config');
    if (!resp.ok) return null;
    const j = await resp.json();
    RECEIVER_ADDRESS = j.receiverAddress || null;
  } catch (err) {
    console.warn('Could not fetch config:', err);
  }
}
fetchConfig();


document.getElementById('newChainBtn').onclick = async () => {
  const resp = await fetch(API_BASE + '/api/chains', { method: 'POST' });
  const data = await resp.json();
  document.getElementById('chainId').textContent = data.chainId;
  document.getElementById('contribute').style.display = 'block';
  document.getElementById('lobby').style.display = 'none';
  document.getElementById('paragraph').textContent = '';
  document.getElementById('status').textContent = 'Contribute to the chain. When enough people submit, the paragraph will be generated.';
};

document.getElementById('submitContrib').onclick = async () => {
  const chainId = document.getElementById('chainId').textContent;
  const text = document.getElementById('contribText').value.trim();
  if (!text) return alert('Write a short sentence first');
  const resp = await fetch(API_BASE + '/api/chains/' + chainId + '/contribute', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ text })
  });
  const j = await resp.json();
  if (!resp.ok) {
    alert(j.error || 'Error');
    return;
  }
  if (j.done) {
    document.getElementById('status').textContent = 'Chain complete — generated paragraph:';
    document.getElementById('paragraph').textContent = j.paragraph;
  } else {
    document.getElementById('status').textContent = `Submitted — ${j.contributions} contributions so far`;
  }
  document.getElementById('contribText').value = '';
};

// Donate button via MetaMask
document.getElementById('donateBtn').onclick = async () => {
  const donateStatus = document.getElementById('donateStatus');
  if (!window.ethereum) {
    donateStatus.textContent = 'MetaMask not found. Install MetaMask to donate.';
    return;
  }
  try {
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    const from = accounts[0];
    // value in hex wei for 0.001 ETH
    if (!RECEIVER_ADDRESS) { donateStatus.textContent = 'Receiver address not configured.'; return; } const value = '0x' + BigInt(Math.floor(0.001 * 1e18)).toString(16);
    const tx = await window.ethereum.request({
      method: 'eth_sendTransaction',
      params: [{ from, to: RECEIVER_ADDRESS, value }],
    });
    donateStatus.textContent = 'Donation sent! Tx: ' + tx;
  } catch (err) {
    donateStatus.textContent = 'Donation failed: ' + (err.message || err);
  }
};
