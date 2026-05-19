// ─── State ─────────────────────────────────────────────────────────────────────
window.flows = {};
var currentFlow = 'pkce';
var currentStep = 0;

// ─── Render ────────────────────────────────────────────────────────────────────
function selectFlow(flowKey) {
  currentFlow = flowKey;
  currentStep = 0;
  document.querySelectorAll('.flow-tab').forEach(t => t.classList.remove('active'));
  event.target.classList.add('active');
  render();
}

function goToStep(index) {
  const steps = flows[currentFlow].steps;
  if (index < 0 || index > steps.length) return;
  currentStep = index;
  render();
  document.querySelector('.content-panel').scrollTo({ top: 0, behavior: 'smooth' });
}

function render() {
  const flow = flows[currentFlow];
  const steps = flow.steps;
  const isComplete = currentStep >= steps.length;

  // Steps panel
  const panel = document.getElementById('steps-panel');
  panel.innerHTML = `<div class="steps-label">${flow.title}</div>` +
    steps.map((s, i) => `
      <div class="step-item ${i === currentStep ? 'active' : ''} ${i < currentStep ? 'completed' : ''}"
           onclick="goToStep(${i})">
        <div class="step-num">${i < currentStep ? '✓' : (i === 0 ? '★' : i)}</div>
        <div>
          <div class="step-title">${s.title}</div>
          <div class="step-actor">${s.actorLabel}</div>
        </div>
      </div>
    `).join('');

  // Content panel
  const content = document.getElementById('content-panel');

  if (isComplete) {
    const summaries = {
      pkce: `
        <p>You've walked through the full Authorization Code + PKCE flow. Here's a summary of all tokens obtained.</p>
        <div class="token-summary">
          <h3>Tokens Obtained</h3>
          <div class="token-row"><span class="token-row-label">Access Token</span><span class="token-row-val">${SIM.accessToken.slice(0,40)}…</span></div>
          <div class="token-row"><span class="token-row-label">Refresh Token</span><span class="token-row-val">${SIM.refreshToken}</span></div>
          <div class="token-row"><span class="token-row-label">ID Token</span><span class="token-row-val">${SIM.idToken.slice(0,40)}…</span></div>
          <div class="token-row"><span class="token-row-label">User</span><span class="token-row-val">${SIM.user.name} (${SIM.user.email})</span></div>
        </div>`,
      clientcredentials: `
        <p>You've walked through the full Client Credentials flow. Here's a summary of what was issued.</p>
        <div class="token-summary">
          <h3>Tokens Obtained</h3>
          <div class="token-row"><span class="token-row-label">Access Token</span><span class="token-row-val">eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiJzdmNfYmlsbGluZ185eDJrIi…</span></div>
          <div class="token-row"><span class="token-row-label">Token Type</span><span class="token-row-val">Bearer</span></div>
          <div class="token-row"><span class="token-row-label">Expires In</span><span class="token-row-val">3600 seconds</span></div>
          <div class="token-row"><span class="token-row-label">Subject (sub)</span><span class="token-row-val">svc_billing_9x2k (the service, not a user)</span></div>
          <div class="token-row"><span class="token-row-label">Scopes</span><span class="token-row-val">reports:read invoices:write</span></div>
          <div class="token-row"><span class="token-row-label">Refresh Token</span><span class="token-row-val">None — service re-authenticates directly</span></div>
        </div>`,
      jwt: `
        <p>You've walked through the full JWT Bearer Assertion flow. Here's a summary of what was exchanged.</p>
        <div class="token-summary">
          <h3>What was exchanged</h3>
          <div class="token-row"><span class="token-row-label">Credential sent</span><span class="token-row-val">Signed JWT assertion (short-lived, one-time use)</span></div>
          <div class="token-row"><span class="token-row-label">Access Token</span><span class="token-row-val">eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiJzdmNfcmVwb3J0aW5nXzdicSIs…</span></div>
          <div class="token-row"><span class="token-row-label">Token Type</span><span class="token-row-val">Bearer</span></div>
          <div class="token-row"><span class="token-row-label">Subject (sub)</span><span class="token-row-val">svc_reporting_7bq (the service)</span></div>
          <div class="token-row"><span class="token-row-label">Scopes</span><span class="token-row-val">reports:read data:export</span></div>
          <div class="token-row"><span class="token-row-label">Private key sent?</span><span class="token-row-val">Never — stayed on the client the entire time</span></div>
        </div>`
    };
    content.innerHTML = `
      <div class="completion">
        <div class="big-icon">🎉</div>
        <h2>Flow Complete!</h2>
        ${summaries[currentFlow] || ''}
        <button class="btn btn-primary" onclick="goToStep(0)">Restart Flow</button>
      </div>`;
    return;
  }

  const step = steps[currentStep];
  content.innerHTML = buildFlowDiagram(currentFlow, currentStep) + step.content() + `
    <div class="step-nav">
      <button class="btn btn-secondary" onclick="goToStep(${currentStep - 1})" ${currentStep === 0 ? 'disabled' : ''}>← Back</button>
      <button class="btn btn-primary" onclick="goToStep(${currentStep + 1})">
        ${currentStep === steps.length - 1 ? 'Finish' : 'Next →'}
      </button>
      <span class="progress-text">Step ${currentStep + 1} of ${steps.length}</span>
    </div>`;
}
