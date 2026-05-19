// ─── State ─────────────────────────────────────────────────────────────────────
window.flows = {};
var currentFlow = 'pkce';
var currentStep = 0;

// ─── Nav helpers ───────────────────────────────────────────────────────────────
function toggleGroup(btn) {
  btn.closest('.flow-nav-group').classList.toggle('open');
}

function selectFlow(flowKey, el) {
  currentFlow = flowKey;
  currentStep = 0;
  document.querySelectorAll('.flow-tab').forEach(t => t.classList.remove('active'));
  if (el) el.classList.add('active');
  // Ensure the parent group is open
  if (el) {
    var group = el.closest('.flow-nav-group');
    if (group) group.classList.add('open');
  }
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
        </div>`,
      samlbearer: `
        <p>You've walked through the full SAML Bearer Assertion flow. Here's a summary of what was exchanged.</p>
        <div class="token-summary">
          <h3>What was exchanged</h3>
          <div class="token-row"><span class="token-row-label">Credential sent</span><span class="token-row-val">Signed SAML 2.0 XML assertion (base64url-encoded)</span></div>
          <div class="token-row"><span class="token-row-label">Access Token</span><span class="token-row-val">00Dax0000000001EAA!ARQAQKGnqC3vVf7Q8xmLg…</span></div>
          <div class="token-row"><span class="token-row-label">instance_url</span><span class="token-row-val">https://myinstance.salesforce.com</span></div>
          <div class="token-row"><span class="token-row-label">Signing method</span><span class="token-row-val">RSA-SHA256 XML Digital Signature (XMLDSig)</span></div>
          <div class="token-row"><span class="token-row-label">Refresh Token</span><span class="token-row-val">None — re-assert when token expires</span></div>
          <div class="token-row"><span class="token-row-label">Private key sent?</span><span class="token-row-val">Never — stayed on the client the entire time</span></div>
        </div>`,
      canvas: `
        <p>You've walked through the Canvas App Signed Request flow — admin pre-authorized path.</p>
        <div class="token-summary">
          <h3>What happened</h3>
          <div class="token-row"><span class="token-row-label">Permitted Users setting</span><span class="token-row-val">Admin approved users are pre-authorized</span></div>
          <div class="token-row"><span class="token-row-label">OAuth flow?</span><span class="token-row-val">None — Salesforce POSTed signed_request directly</span></div>
          <div class="token-row"><span class="token-row-label">Signing algorithm</span><span class="token-row-val">HMAC-SHA256 using Consumer Secret</span></div>
          <div class="token-row"><span class="token-row-label">Access Token</span><span class="token-row-val">00Dax0000000001EAA!ARQAQKGnqC3vVf7Q8xmLg… (from oauthToken)</span></div>
          <div class="token-row"><span class="token-row-label">instance_url</span><span class="token-row-val">https://myinstance.salesforce.com (from targetOrigin)</span></div>
          <div class="token-row"><span class="token-row-label">Consumer Secret sent?</span><span class="token-row-val">Never — used locally for verification only</span></div>
        </div>`,
      canvasfirst: `
        <p>You've walked through the Canvas App Signed Request flow — self-authorization path.</p>
        <div class="token-summary">
          <h3>What happened</h3>
          <div class="token-row"><span class="token-row-label">Permitted Users setting</span><span class="token-row-val">All users may self-authorize</span></div>
          <div class="token-row"><span class="token-row-label">Extra steps</span><span class="token-row-val">Canvas app ran OAuth user-agent flow via oauth.login() + repost()</span></div>
          <div class="token-row"><span class="token-row-label">Signal to canvas app</span><span class="token-row-val">_sfdc_canvas_authvalue=user_approval_required</span></div>
          <div class="token-row"><span class="token-row-label">Approval stored</span><span class="token-row-val">Yes — next session Salesforce POSTs signed_request directly</span></div>
          <div class="token-row"><span class="token-row-label">Access Token</span><span class="token-row-val">00Dax0000000001EAA!ARQAQKGnqC3vVf7Q8xmLg… (from oauthToken)</span></div>
          <div class="token-row"><span class="token-row-label">Consumer Secret sent?</span><span class="token-row-val">Never — used locally for verification only</span></div>
        </div>`,
      spinitsso: `
        <p>You've walked through SP-Initiated SSO with Salesforce as the Service Provider.</p>
        <div class="token-summary">
          <h3>What happened</h3>
          <div class="token-row"><span class="token-row-label">Initiated by</span><span class="token-row-val">User accessing Salesforce My Domain URL</span></div>
          <div class="token-row"><span class="token-row-label">AuthnRequest</span><span class="token-row-val">Signed XML sent via HTTP Redirect to IDP</span></div>
          <div class="token-row"><span class="token-row-label">SAML Response</span><span class="token-row-val">Signed XML POSTed by IDP to Salesforce ACS URL</span></div>
          <div class="token-row"><span class="token-row-label">Signature algorithm</span><span class="token-row-val">XML Digital Signature (RSA-SHA256) — IDP's private key</span></div>
          <div class="token-row"><span class="token-row-label">User matching</span><span class="token-row-val">NameID in assertion matched to Salesforce username</span></div>
          <div class="token-row"><span class="token-row-label">Result</span><span class="token-row-val">Salesforce session created — user redirected via RelayState</span></div>
        </div>`,
      spinitsso_idp: `
        <p>You've walked through SP-Initiated SSO with Salesforce as the Identity Provider.</p>
        <div class="token-summary">
          <h3>What happened</h3>
          <div class="token-row"><span class="token-row-label">Initiated by</span><span class="token-row-val">User accessing the external Service Provider</span></div>
          <div class="token-row"><span class="token-row-label">AuthnRequest</span><span class="token-row-val">Signed XML from SP redirected to Salesforce IDP endpoint</span></div>
          <div class="token-row"><span class="token-row-label">SAML Response</span><span class="token-row-val">Signed XML POSTed by Salesforce to SP ACS URL</span></div>
          <div class="token-row"><span class="token-row-label">Salesforce config</span><span class="token-row-val">Identity Provider enabled + Connected App per SP</span></div>
          <div class="token-row"><span class="token-row-label">Access control</span><span class="token-row-val">Profile/permission set assigned to connected app</span></div>
          <div class="token-row"><span class="token-row-label">Result</span><span class="token-row-val">External SP session created — user redirected via RelayState</span></div>
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
