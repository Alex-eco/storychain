/*
  StoryChain Frontend
  -------------------
  - Creates a new story chain and sends contributions
  - Fetches generated paragraphs from the backend
  - Handles crypto donations via MetaMask

  Notes:
  • Backend URL: update API_BASE below if backend changes.
  • Receiver wallet is fetched from backend securely via /api/config.
*/

// ===== Config =====
const API_BASE = 'https://storychain-4.onrender.com'; // your Render backend
const RECEIVER_ADDRESS = '0x510D84Ccfd47fF2cD5dd86Dd34c601293a42cab3'; // <-- your wallet

//let RECEIVER_ADDRESS = null; // will be fetched dynamically

// ===== Fetch Receiver Address from Backend =====
//async function fetchConfig() {
 // try {
 //   const resp = await fetch(`${API_BASE}/api/config`);
  //  if (!resp.ok) throw new Error(`Config fetch failed: ${resp.status}`);
 //   const j = await resp.json();
 //   RECEIVER_ADDRESS = j.receiverAddress;
 //   console.log('Receiver address:', RECEIVER_ADDRESS);
 // } catch (err) {
  //  console.warn('Could not fetch config:', err);
 // }
//}
//fetchConfig();

// ===== UI Logic =====
document.getElementById('newChainBtn').onclick = async () => {
  const resp = await fetch(`${API_BASE}/api/chains`, { method: 'POST' });
  const data = await resp.json();

  document.getElementById('chainId').textContent = data.chainId;
  document.getElementById('contribute').style.display = 'block';
  document.getElementById('lobby').style.display = 'none';
  document.getElementById('paragraph').textContent = '';
  document.getElementById('status').textContent =
    'Contribute to the chain. When enough people submit, a paragraph will be generated.';
};

document.getElementById('submitContrib').onclick = async () => {
  const chainId = document.getElementById('chainId').textContent;
  const text = document.getElementById('contribText').value.trim();
  if (!text) return alert('Write a short sentence first!');

  const resp = await fetch(`${API_BASE}/api/chains/${chainId}/contribute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  const j = await resp.json();

  if (!resp.ok) {
    alert(j.error || 'Error');
    return;
  }

  if (j.done) {
    document.getElementById('status').textContent =
      'Chain complete — generated paragraph:';
    document.getElementById('paragraph').textContent = j.paragraph;
  } else {
    document.getElementById('status').textContent = `Submitted — ${j.contributions} contributions so far`;
  }

  document.getElementById('contribText').value = '';
};

// ===== Donate via MetaMask =====
document.getElementById('donateBtn').onclick = async () => {
  const donateStatus = document.getElementById('donateStatus');

  if (!window.ethereum) {
    donateStatus.textContent = 'MetaMask not found. Please install MetaMask.';
    return;
  }

  if (!RECEIVER_ADDRESS) {
    donateStatus.textContent = 'Receiver address not configured yet.';
    return;
  }

  try {
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts',
    });
    const from = accounts[0];

    // 0.001 ETH in wei
    const value = '0x' + BigInt(Math.floor(0.001 * 1e18)).toString(16);

    const tx = await window.ethereum.request({
      method: 'eth_sendTransaction',
      params: [{ from, to: RECEIVER_ADDRESS, value }],
    });

    donateStatus.textContent = `Donation sent! Tx: ${tx}`;
  } catch (err) {
    donateStatus.textContent = 'Donation failed: ' + (err.message || err);
  }
};
