window.flows.jwt = {
  title: 'JWT Bearer Assertion Flow',
  steps: [
    {
      title: 'Overview',
      actor: 'intro',
      actorLabel: 'Introduction',
      actorClass: 'actor-client',
      content: () => `
          <div class="step-header">
            <span class="actor-badge actor-client">Introduction</span>
            <h2>JWT Bearer Assertion Flow</h2>
            <p>Defined in RFC 7523, this flow lets a client prove its identity by presenting a <strong>self-signed JWT</strong> instead of a client secret or an authorization code. The JWT is the credential — the auth server verifies the signature and issues an access token.</p>
          </div>

          <div class="section">
            <div class="section-title">Actors in this flow</div>
            <div class="flow-diagram">
              <svg width="560" height="90" viewBox="0 0 560 90">
                <rect x="10" y="20" width="150" height="50" rx="8" fill="#1a1d27" stroke="#6c63ff" stroke-width="1.5"/>
                <text x="85" y="42" text-anchor="middle" fill="#6c63ff" font-size="11" font-weight="700">CLIENT SERVICE</text>
                <text x="85" y="57" text-anchor="middle" fill="#7c809a" font-size="10">Holds a private key</text>
                <line x1="160" y1="45" x2="230" y2="45" stroke="#2e3248" stroke-width="1.5" marker-end="url(#arr3)"/>
                <rect x="230" y="20" width="150" height="50" rx="8" fill="#1a1d27" stroke="#f7c948" stroke-width="1.5"/>
                <text x="305" y="42" text-anchor="middle" fill="#f7c948" font-size="11" font-weight="700">AUTH SERVER</text>
                <text x="305" y="57" text-anchor="middle" fill="#7c809a" font-size="10">Has matching public key</text>
                <line x1="380" y1="45" x2="450" y2="45" stroke="#2e3248" stroke-width="1.5" marker-end="url(#arr3)"/>
                <rect x="450" y="20" width="100" height="50" rx="8" fill="#1a1d27" stroke="#43d98c" stroke-width="1.5"/>
                <text x="500" y="42" text-anchor="middle" fill="#43d98c" font-size="11" font-weight="700">RESOURCE API</text>
                <text x="500" y="57" text-anchor="middle" fill="#7c809a" font-size="10">Protected service</text>
                <defs>
                  <marker id="arr3" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                    <path d="M0,0 L0,6 L6,3 z" fill="#2e3248"/>
                  </marker>
                </defs>
              </svg>
            </div>
          </div>

          <div class="section">
            <div class="section-title">How it differs from Client Credentials</div>
            <div class="explanation-box">
              Both flows are machine-to-machine with no user involved. The key difference is <strong>how the client proves its identity</strong>:
              <ul>
                <li><span class="highlight">Client Credentials</span> — client sends a shared secret (<code>client_secret</code>). The secret must be stored on both sides.</li>
                <li><span class="hl-green">JWT Bearer</span> — client signs a JWT with its <strong>private key</strong>. The auth server verifies using the matching <strong>public key</strong>. The private key never leaves the client.</li>
              </ul>
              <br>
              This is <span class="hl-green">asymmetric cryptography</span> — much stronger than a shared secret, and the foundation of how Google service accounts, Salesforce connected apps, and AWS service-to-service auth work.
            </div>
            <div class="callout">
              <span class="callout-icon">🔑</span>
              <div class="callout-body">
                <strong>The private key never travels the network</strong>
                Unlike a client_secret which is sent on every request, the private key is only used locally to sign the JWT. The auth server only ever sees the signature output.
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Common real-world uses</div>
            <div class="explanation-box">
              <ul>
                <li><span class="hl-green">Google APIs</span> — service accounts use JWT assertions to call Google APIs</li>
                <li><span class="hl-green">Salesforce</span> — JWT Bearer flow for server-to-server Connected App authentication</li>
                <li><span class="hl-green">GitHub Actions</span> — OIDC tokens (a variant) to authenticate to cloud providers without secrets</li>
                <li><span class="hl-green">Enterprise SSO</span> — SAML-to-OAuth bridges often use JWT assertions</li>
              </ul>
            </div>
          </div>
        `
    },
    {
      title: 'Key Pair Setup',
      actor: 'Client Service',
      actorLabel: 'Client Service',
      actorClass: 'actor-client',
      content: () => `
          <div class="step-header">
            <span class="actor-badge actor-client">Client Service</span>
            <h2>Step 1 — Generate & Register a Key Pair</h2>
            <p>Before the flow can run, a one-time setup is needed: the client generates an RSA or EC key pair. The public key is registered with the auth server. The private key stays on the client, forever.</p>
          </div>

          <div class="section">
            <div class="section-title">Generate the key pair (one-time setup)</div>
            <div class="data-card">
              <div class="data-card-header">Key generation — done once, stored securely
                <span class="direction-badge dir-generate">Generated locally</span>
              </div>
              <pre><span class="comment">// Generate RSA-256 key pair (2048-bit minimum, 4096-bit recommended)</span>
<span class="comment">// Command line example:</span>
openssl genrsa -out private_key.pem 2048
openssl rsa -in private_key.pem -pubout -out public_key.pem

<span class="comment">// Or as a JWK (JSON Web Key) — preferred for OAuth:</span>
{
  <span class="key">"kty"</span>: <span class="val">"RSA"</span>,
  <span class="key">"kid"</span>: <span class="val">"key-2026-04"</span>,         <span class="comment">// Key ID — used to identify which key signed the JWT</span>
  <span class="key">"n"</span>:   <span class="val">"0vx7agoebGcQSuuPiLJXZptN9nndrQmbXEps2..."</span>,  <span class="comment">// Public modulus</span>
  <span class="key">"e"</span>:   <span class="val">"AQAB"</span>                  <span class="comment">// Public exponent</span>
}</pre>
            </div>
          </div>

          <div class="section">
            <div class="section-title">What gets shared with the auth server</div>
            <div class="data-card">
              <div class="data-card-header">Public key — registered in auth server's client config</div>
              <pre><span class="comment">// Only the PUBLIC key is shared. The auth server stores it against your client_id.</span>
{
  <span class="key">"client_id"</span>:  <span class="val">"svc_reporting_7bq"</span>,
  <span class="key">"public_key"</span>: {
    <span class="key">"kty"</span>: <span class="val">"RSA"</span>,
    <span class="key">"kid"</span>: <span class="val">"key-2026-04"</span>,
    <span class="key">"n"</span>:   <span class="val">"0vx7agoebGcQSuuPiLJXZptN9nndrQmbXEps2..."</span>,
    <span class="key">"e"</span>:   <span class="val">"AQAB"</span>
  }
}

<span class="comment">// The private key NEVER leaves your server. Not in config files, not in git.</span></pre>
            </div>
          </div>

          <div class="callout">
            <span class="callout-icon">🗝️</span>
            <div class="callout-body">
              <strong>Store the private key in a secrets manager or HSM</strong>
              AWS KMS, GCP Cloud KMS, HashiCorp Vault, or an HSM (Hardware Security Module) can hold and use the private key without it ever being readable in plaintext.
            </div>
          </div>
        `
    },
    {
      title: 'Build the JWT Assertion',
      actor: 'Client Service',
      actorLabel: 'Client Service',
      actorClass: 'actor-client',
      content: () => `
          <div class="step-header">
            <span class="actor-badge actor-client">Client Service</span>
            <h2>Step 2 — Build and Sign the JWT Assertion</h2>
            <p>When the service needs an access token, it constructs a JWT with specific claims that identify the request, then signs it with its private key. This JWT is the assertion — the proof of identity.</p>
          </div>

          <div class="section">
            <div class="section-title">JWT Header</div>
            <div class="data-card">
              <div class="data-card-header">JWT Header — describes the signing algorithm and key
                <span class="direction-badge dir-generate">Built locally</span>
              </div>
              <pre>{
  <span class="key">"alg"</span>: <span class="val">"RS256"</span>,       <span class="comment">// RSA + SHA-256. Also common: ES256 (ECDSA)</span>
  <span class="key">"typ"</span>: <span class="val">"JWT"</span>,
  <span class="key">"kid"</span>: <span class="val">"key-2026-04"</span>  <span class="comment">// Tells the server WHICH public key to use for verification</span>
}</pre>
            </div>
          </div>

          <div class="section">
            <div class="section-title">JWT Payload (claims)</div>
            <div class="data-card">
              <div class="data-card-header">JWT Payload — the assertion claims
                <span class="direction-badge dir-generate">Built locally</span>
              </div>
              <pre>{
  <span class="key">"iss"</span>: <span class="val">"svc_reporting_7bq"</span>,
  <span class="comment">       // Issuer = your client_id. "I am the one making this request."</span>

  <span class="key">"sub"</span>: <span class="val">"svc_reporting_7bq"</span>,
  <span class="comment">       // Subject = who this token is about. For M2M: same as iss.</span>
  <span class="comment">       // For on-behalf-of flows: this would be a user's ID instead.</span>

  <span class="key">"aud"</span>: <span class="val">"https://auth.example.com/oauth/token"</span>,
  <span class="comment">       // Audience = the TOKEN ENDPOINT specifically, not just the auth server.</span>
  <span class="comment">       // This scopes the assertion to one specific use.</span>

  <span class="key">"iat"</span>: <span class="val">1745596400</span>,
  <span class="comment">       // Issued at — current Unix timestamp</span>

  <span class="key">"exp"</span>: <span class="val">1745596700</span>,
  <span class="comment">       // Expires at — MUST be short. Max 5 minutes from iat.</span>
  <span class="comment">       // Prevents replay attacks: a stolen assertion expires fast.</span>

  <span class="key">"jti"</span>: <span class="val">"a8f3c1d9-4e72-4b0a-88f2-1c6d9e0b3f5a"</span>
  <span class="comment">       // JWT ID — unique per assertion. Auth server can reject replays.</span>
}</pre>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Signing — putting it all together</div>
            <div class="data-card">
              <div class="data-card-header">Signed JWT — the complete assertion</div>
              <pre><span class="comment">// Structure: BASE64URL(header) + "." + BASE64URL(payload) + "." + SIGNATURE</span>

<span class="val">eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImtleS0yMDI2LTA0In0</span>
<span class="comment">// ↑ header (base64url encoded)</span>

.<span class="val">eyJpc3MiOiJzdmNfcmVwb3J0aW5nXzdicSIsInN1YiI6InN2Y19yZXBvcnRpbmdfN2JxIiwiYXVkIjoiaHR0cHM6Ly9hdXRoLmV4YW1wbGUuY29tL29hdXRoL3Rva2VuIiwiaWF0IjoxNzQ1NTk2NDAwLCJleHAiOjE3NDU1OTY3MDAsImp0aSI6ImE4ZjNjMWQ5LTRlNzItNGIwYS04OGYyLTFjNmQ5ZTBiM2Y1YSJ9</span>
<span class="comment">// ↑ payload (base64url encoded)</span>

.<span class="val">TQpL3mVk8X2nR9wC4dF7jHaE1bNs6oKyMvWzPuIqGtYlUcOeAiZrBhDxSfJgE2</span>
<span class="comment">// ↑ RSA-SHA256 signature of header.payload, using the private key</span></pre>
            </div>
          </div>

          <div class="callout">
            <span class="callout-icon">⏱️</span>
            <div class="callout-body">
              <strong>Keep exp short — 5 minutes maximum</strong>
              If this JWT assertion is intercepted, the attacker has a window to use it. A 5-minute expiry limits the damage. The <code>jti</code> lets the auth server reject already-used assertions entirely.
            </div>
          </div>
        `
    },
    {
      title: 'POST the Assertion',
      actor: 'Client Service',
      actorLabel: 'Client Service',
      actorClass: 'actor-client',
      content: () => `
          <div class="step-header">
            <span class="actor-badge actor-client">Client Service</span>
            <h2>Step 3 — POST the JWT Assertion to the Token Endpoint</h2>
            <p>The signed JWT is sent as the <code>client_assertion</code> parameter. There is no client_secret — the signed JWT is the credential.</p>
          </div>

          <div class="section">
            <div class="section-title">Token request</div>
            <div class="data-card">
              <div class="data-card-header">POST https://auth.example.com/oauth/token
                <span class="direction-badge dir-send">Sent by service</span>
              </div>
              <pre>POST /oauth/token HTTP/1.1
Host: auth.example.com
Content-Type: application/x-www-form-urlencoded

<span class="key">grant_type</span>             = <span class="val">client_credentials</span>
<span class="comment">                         // Still client_credentials — but auth method is JWT, not secret</span>

<span class="key">client_assertion_type</span>  = <span class="val">urn:ietf:params:oauth:client-assertion-type:jwt-bearer</span>
<span class="comment">                         // Tells the server: "my credential is a JWT assertion"</span>

<span class="key">client_assertion</span>       = <span class="val">eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImtleS0yMDI2LTA0In0</span>
                         <span class="val">.eyJpc3MiOiJzdmNfcmVwb3J0aW5nXzdicSIsInN1YiI6InN2Y19yZX...</span>
                         <span class="val">.TQpL3mVk8X2nR9wC4dF7jHaE1bNs6oKyMvWzPuIqGtYlUcOeAiZr</span>
<span class="comment">                         // The full signed JWT from Step 2</span>

<span class="key">scope</span>                  = <span class="val">reports:read data:export</span>

<span class="comment">// Note: NO client_id in the body — it's inside the JWT's "iss" claim</span>
<span class="comment">// Note: NO Authorization header — the JWT replaces it entirely</span></pre>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Comparison: JWT assertion vs client secret</div>
            <div class="explanation-box">
              <ul>
                <li><span class="hl-green">JWT assertion</span>: no shared secret, private key stays on client, each assertion is unique and expires fast</li>
                <li><span class="highlight">Client secret</span>: shared secret sent on every call, static (until rotated), stolen secret is immediately usable</li>
              </ul>
              <br>
              Both are valid. JWT Bearer is preferred when the auth server and client can manage key pairs — it's more secure and eliminates secret sprawl.
            </div>
          </div>
        `
    },
    {
      title: 'Auth Server Validates',
      actor: 'Auth Server',
      actorLabel: 'Auth Server',
      actorClass: 'actor-authserver',
      content: () => `
          <div class="step-header">
            <span class="actor-badge actor-authserver">Auth Server</span>
            <h2>Step 4 — Auth Server Validates the JWT Assertion</h2>
            <p>The auth server performs a chain of cryptographic and semantic checks on the JWT before it will issue any token. If any check fails, the request is rejected with an error.</p>
          </div>

          <div class="section">
            <div class="section-title">Validation steps (in order)</div>
            <div class="explanation-box">
              <ul>
                <li><span class="hl-green">1. Look up client</span> — read <code>iss</code> from the JWT payload, find the registered client <code>svc_reporting_7bq</code></li>
                <li><span class="hl-green">2. Find the public key</span> — use <code>kid</code> from the JWT header to select the right registered public key</li>
                <li><span class="hl-green">3. Verify the signature</span> — cryptographically verify that the JWT was signed by the private key matching the registered public key</li>
                <li><span class="hl-yellow">4. Check aud</span> — must equal this token endpoint's URL exactly. Rejects JWTs meant for other services.</li>
                <li><span class="hl-yellow">5. Check exp</span> — must not be expired</li>
                <li><span class="hl-yellow">6. Check iat</span> — issued-at must not be in the future (clock skew check, usually ±30s tolerance)</li>
                <li><span class="highlight">7. Check jti</span> — if the server tracks used JTIs, reject any already seen. Prevents replay attacks.</li>
                <li><span class="highlight">8. Check scopes</span> — requested scopes must be allowed for this client</li>
              </ul>
            </div>
          </div>

          <div class="section">
            <div class="section-title">What the auth server looks up internally</div>
            <div class="data-card">
              <div class="data-card-header">Auth server — registered client record</div>
              <pre>{
  <span class="key">"client_id"</span>:        <span class="val">"svc_reporting_7bq"</span>,
  <span class="key">"auth_method"</span>:      <span class="val">"private_key_jwt"</span>,     <span class="comment">// No client_secret stored</span>
  <span class="key">"jwks"</span>: [
    {
      <span class="key">"kid"</span>: <span class="val">"key-2026-04"</span>,
      <span class="key">"kty"</span>: <span class="val">"RSA"</span>,
      <span class="key">"n"</span>:   <span class="val">"0vx7agoebGcQSuuPiLJXZptN9nndrQmbXEps2..."</span>,
      <span class="key">"e"</span>:   <span class="val">"AQAB"</span>
    }
  ],
  <span class="key">"allowed_scopes"</span>:   <span class="val">["reports:read", "data:export"]</span>
}</pre>
            </div>
          </div>

          <div class="callout">
            <span class="callout-icon">🔏</span>
            <div class="callout-body">
              <strong>Signature verification is the core security guarantee</strong>
              Only the holder of the private key can produce a valid signature. If the signature check passes, the auth server knows with cryptographic certainty the request came from the registered client.
            </div>
          </div>
        `
    },
    {
      title: 'Receive Access Token',
      actor: 'Auth Server',
      actorLabel: 'Auth Server',
      actorClass: 'actor-authserver',
      content: () => `
          <div class="step-header">
            <span class="actor-badge actor-authserver">Auth Server</span>
            <h2>Step 5 — Auth Server Returns the Access Token</h2>
            <p>Validation passed. The auth server issues an access token — the response looks identical to the Client Credentials response.</p>
          </div>

          <div class="section">
            <div class="section-title">Token response</div>
            <div class="data-card">
              <div class="data-card-header">200 OK — application/json
                <span class="direction-badge dir-receive">Received by service</span>
              </div>
              <pre>{
  <span class="key">"access_token"</span>: <span class="val">"eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiJzdmNfcmVwb3J0aW5nXzdicSIsInNjb3BlIjoicmVwb3J0czpyZWFkIGRhdGE6ZXhwb3J0IiwiZXhwIjoxNzQ1NjAwMDAwfQ.sig"</span>,
  <span class="key">"token_type"</span>:   <span class="val">"Bearer"</span>,
  <span class="key">"expires_in"</span>:   <span class="val">3600</span>,
  <span class="key">"scope"</span>:        <span class="val">"reports:read data:export"</span>
  <span class="comment">// No refresh_token — same reasoning as Client Credentials: just re-assert</span>
}</pre>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Decoded access token payload</div>
            <div class="data-card">
              <div class="data-card-header">Access token JWT payload</div>
              <pre>{
  <span class="key">"iss"</span>:    <span class="val">"https://auth.example.com"</span>,
  <span class="key">"sub"</span>:    <span class="val">"svc_reporting_7bq"</span>,     <span class="comment">// Subject = the client service</span>
  <span class="key">"aud"</span>:    <span class="val">"https://api.example.com"</span>, <span class="comment">// Intended for the resource API</span>
  <span class="key">"iat"</span>:    <span class="val">1745596400</span>,
  <span class="key">"exp"</span>:    <span class="val">1745600000</span>,
  <span class="key">"scope"</span>:  <span class="val">"reports:read data:export"</span>,
  <span class="key">"client_id"</span>: <span class="val">"svc_reporting_7bq"</span>
}</pre>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Key rotation</div>
            <div class="explanation-box">
              Unlike a client_secret, key pairs can be rotated with <strong>zero downtime</strong>:
              <ul>
                <li>Register the new public key with the auth server (alongside the old one, using a new <code>kid</code>)</li>
                <li>Update the service to sign with the new private key</li>
                <li>Once confirmed working, remove the old public key registration</li>
              </ul>
              Both keys are valid simultaneously during the transition — no service interruption.
            </div>
          </div>
        `
    },
    {
      title: 'Call the Protected API',
      actor: 'Client Service',
      actorLabel: 'Client Service',
      actorClass: 'actor-client',
      content: () => `
          <div class="step-header">
            <span class="actor-badge actor-client">Client Service</span>
            <h2>Step 6 — Call the Protected API</h2>
            <p>The access token is used exactly the same way as in any other OAuth flow — as a Bearer token in the Authorization header.</p>
          </div>

          <div class="section">
            <div class="section-title">API request</div>
            <div class="data-card">
              <div class="data-card-header">GET https://api.example.com/v1/reports/monthly
                <span class="direction-badge dir-send">Sent by service</span>
              </div>
              <pre>GET /v1/reports/monthly HTTP/1.1
Host: api.example.com
Authorization: Bearer <span class="val">eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiJzdmNfcmVwb3J0aW5nXzdicSIs...</span></pre>
            </div>
          </div>

          <div class="section">
            <div class="section-title">API response</div>
            <div class="data-card">
              <div class="data-card-header">200 OK
                <span class="direction-badge dir-receive">Received by service</span>
              </div>
              <pre>{
  <span class="key">"report_id"</span>:    <span class="val">"rpt_2026_04"</span>,
  <span class="key">"generated_by"</span>: <span class="val">"svc_reporting_7bq"</span>,
  <span class="key">"rows"</span>:         <span class="val">14823</span>,
  <span class="key">"status"</span>:       <span class="val">"complete"</span>
}</pre>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Full flow summary — what traveled the network</div>
            <div class="explanation-box">
              <ul>
                <li><span class="hl-green">Sent to auth server:</span> the signed JWT assertion (short-lived, one-time use)</li>
                <li><span class="hl-yellow">Received from auth server:</span> access token (1 hour)</li>
                <li><span class="hl-green">Sent to API:</span> access token as Bearer header</li>
                <li><span class="highlight">Never sent anywhere:</span> the private key</li>
              </ul>
              <br>
              Compare this to Client Credentials: instead of sending <code>client_secret</code> on every token request, you send a freshly signed JWT. The private key that generated it never left your server.
            </div>
          </div>

          <div class="callout">
            <span class="callout-icon">♻️</span>
            <div class="callout-body">
              <strong>Re-asserting when the access token expires</strong>
              Build a new JWT assertion (new <code>iat</code>, <code>exp</code>, <code>jti</code>), sign it, POST it again. Same as Step 3. Cache the access token and reuse it until it's close to expiry — don't assert on every API call.
            </div>
          </div>
        `
    }
  ]
};
