window.flows.clientcredentials = {
  title: 'Client Credentials Flow',
  steps: [
    {
      title: 'Overview',
      actor: 'intro',
      actorLabel: 'Introduction',
      actorClass: 'actor-client',
      content: () => `
          <div class="step-header">
            <span class="actor-badge actor-client">Introduction</span>
            <h2>Client Credentials Flow</h2>
            <p>The simplest OAuth 2.0 flow — and the right one for machine-to-machine (M2M) communication. There is no user, no browser, no redirect. A backend service authenticates as itself using its own credentials and gets a token to call other services.</p>
          </div>

          <div class="section">
            <div class="section-title">Actors in this flow</div>
            <div class="flow-diagram">
              <svg width="560" height="90" viewBox="0 0 560 90">
                <rect x="10" y="20" width="150" height="50" rx="8" fill="#1a1d27" stroke="#6c63ff" stroke-width="1.5"/>
                <text x="85" y="42" text-anchor="middle" fill="#6c63ff" font-size="11" font-weight="700">CLIENT SERVICE</text>
                <text x="85" y="57" text-anchor="middle" fill="#7c809a" font-size="10">Backend app / daemon</text>
                <line x1="160" y1="45" x2="230" y2="45" stroke="#2e3248" stroke-width="1.5" marker-end="url(#arr2)"/>
                <rect x="230" y="20" width="150" height="50" rx="8" fill="#1a1d27" stroke="#f7c948" stroke-width="1.5"/>
                <text x="305" y="42" text-anchor="middle" fill="#f7c948" font-size="11" font-weight="700">AUTH SERVER</text>
                <text x="305" y="57" text-anchor="middle" fill="#7c809a" font-size="10">Issues access tokens</text>
                <line x1="380" y1="45" x2="450" y2="45" stroke="#2e3248" stroke-width="1.5" marker-end="url(#arr2)"/>
                <rect x="450" y="20" width="100" height="50" rx="8" fill="#1a1d27" stroke="#43d98c" stroke-width="1.5"/>
                <text x="500" y="42" text-anchor="middle" fill="#43d98c" font-size="11" font-weight="700">RESOURCE API</text>
                <text x="500" y="57" text-anchor="middle" fill="#7c809a" font-size="10">Protected service</text>
                <defs>
                  <marker id="arr2" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                    <path d="M0,0 L0,6 L6,3 z" fill="#2e3248"/>
                  </marker>
                </defs>
              </svg>
            </div>
          </div>

          <div class="section">
            <div class="section-title">When to use this flow</div>
            <div class="explanation-box">
              Use Client Credentials when there is <strong>no human user involved</strong>:
              <ul>
                <li>A <span class="hl-green">cron job</span> that syncs data between two systems overnight</li>
                <li>A <span class="hl-green">microservice</span> calling another microservice's API</li>
                <li>A <span class="hl-green">CI/CD pipeline</span> deploying or calling a protected internal API</li>
                <li>A <span class="hl-green">data pipeline</span> reading from a secured data warehouse</li>
              </ul>
              <br>
              The client is a <span class="highlight">confidential client</span> — it runs on a server you control and can safely store a <span class="hl-yellow">client_secret</span>.
            </div>
            <div class="callout">
              <span class="callout-icon">🚫</span>
              <div class="callout-body">
                <strong>Never use this for user-facing apps</strong>
                Client Credentials tokens represent the <em>application</em>, not a user. There's no <code>sub</code> claim tied to a person. Use Auth Code + PKCE if a human is involved.
              </div>
            </div>
          </div>
        `
    },
    {
      title: 'Prepare Credentials',
      actor: 'Client Service',
      actorLabel: 'Client Service',
      actorClass: 'actor-client',
      content: () => `
          <div class="step-header">
            <span class="actor-badge actor-client">Client Service</span>
            <h2>Step 1 — Prepare Client Credentials</h2>
            <p>Before making any request, the service has its credentials on hand. These are issued when you register the application with the auth server — similar to a username and password, but for a machine.</p>
          </div>

          <div class="section">
            <div class="section-title">Credentials the service holds</div>
            <div class="data-card">
              <div class="data-card-header">Stored securely in environment / secrets manager
                <span class="direction-badge dir-generate">Pre-configured</span>
              </div>
              <pre><span class="key">client_id</span>      = <span class="val">"svc_billing_9x2k"</span>
<span class="comment">                 // Public identifier for this service</span>
<span class="comment">                 // Safe to log, but not alone sufficient to authenticate</span>

<span class="key">client_secret</span>  = <span class="val">"sk_prod_Xv7mN3pQ8rLt2wK9yBdF5jHcAeUo"</span>
<span class="comment">                 // Secret known only to this service and the auth server</span>
<span class="comment">                 // NEVER hardcode — store in env vars or a secrets vault</span>

<span class="key">token_endpoint</span> = <span class="val">"https://auth.example.com/oauth/token"</span>
<span class="key">scope</span>          = <span class="val">"reports:read invoices:write"</span>
<span class="comment">                 // Only request scopes this service actually needs</span></pre>
            </div>
          </div>

          <div class="section">
            <div class="section-title">How to authenticate: two options</div>
            <div class="explanation-box">
              The auth server needs to verify <span class="highlight">client_id</span> + <span class="hl-yellow">client_secret</span>. There are two standard ways to send them:
              <ul>
                <li><span class="hl-green">HTTP Basic Auth</span> — encode <code>client_id:client_secret</code> as Base64 and send in the <code>Authorization</code> header. Most common.</li>
                <li><span class="highlight">Request body</span> — send both as form fields. Simpler but slightly less secure (may appear in server logs).</li>
              </ul>
              We'll use <span class="hl-green">Basic Auth</span> in the next step, which is the recommended approach.
            </div>
          </div>

          <div class="callout">
            <span class="callout-icon">🔐</span>
            <div class="callout-body">
              <strong>Treat client_secret like a password</strong>
              Rotate it regularly, store it in a secrets manager (AWS Secrets Manager, Vault, GCP Secret Manager), and never commit it to source control.
            </div>
          </div>
        `
    },
    {
      title: 'Request a Token',
      actor: 'Client Service',
      actorLabel: 'Client Service',
      actorClass: 'actor-client',
      content: () => `
          <div class="step-header">
            <span class="actor-badge actor-client">Client Service</span>
            <h2>Step 2 — POST to the Token Endpoint</h2>
            <p>The service makes a single direct POST request to the auth server. No browser, no redirect, no user interaction — just one HTTP call.</p>
          </div>

          <div class="section">
            <div class="section-title">Token request</div>
            <div class="data-card">
              <div class="data-card-header">POST https://auth.example.com/oauth/token
                <span class="direction-badge dir-send">Sent by service</span>
              </div>
              <pre>POST /oauth/token HTTP/1.1
Host: auth.example.com
Authorization: Basic <span class="val">c3ZjX2JpbGxpbmdfOXgyazpza19wcm9kX1h2N21OM3BROHJMdDJ3Szl5QmRGNWpIY0FlVW8=</span>
<span class="comment">                       // Base64( "svc_billing_9x2k:sk_prod_Xv7mN3..." )</span>
Content-Type: application/x-www-form-urlencoded

<span class="key">grant_type</span> = <span class="val">client_credentials</span>
<span class="comment">             // Tells the server: "I am authenticating as myself, not on behalf of a user"</span>

<span class="key">scope</span>      = <span class="val">reports:read invoices:write</span>
<span class="comment">             // Request only the permissions this service needs (principle of least privilege)</span></pre>
            </div>
          </div>

          <div class="section">
            <div class="section-title">That's the entire request — why is it so simple?</div>
            <div class="explanation-box">
              Unlike the Auth Code flow, there is:
              <ul>
                <li>No <span class="highlight">redirect_uri</span> — there's no browser to redirect</li>
                <li>No <span class="highlight">state</span> — no CSRF risk since no user browser is involved</li>
                <li>No <span class="hl-green">code_verifier</span> — PKCE is for public clients; this is a confidential client with a secret</li>
                <li>No <span class="hl-yellow">authorization code</span> step — credentials are presented directly</li>
              </ul>
              <br>
              The tradeoff: the <span class="hl-yellow">client_secret</span> must be kept truly secret. If it leaks, an attacker can impersonate your entire service.
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
            <h2>Step 3 — Auth Server Validates the Client</h2>
            <p>The auth server verifies the credentials and checks the requested scopes before issuing a token. There's no user session, no consent screen — it's a pure machine-to-machine check.</p>
          </div>

          <div class="section">
            <div class="section-title">What the auth server checks</div>
            <div class="explanation-box">
              <ul>
                <li><span class="hl-green">client_id exists</span> — looks up the registered client in its database</li>
                <li><span class="hl-green">client_secret matches</span> — compares the provided secret (hashed) against the stored hash</li>
                <li><span class="highlight">client is active</span> — not revoked or disabled</li>
                <li><span class="hl-yellow">grant type allowed</span> — confirms this client is permitted to use <code>client_credentials</code></li>
                <li><span class="hl-yellow">scopes are valid</span> — checks the requested scopes are registered for this client</li>
              </ul>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Auth server's internal client record (not sent to requester)</div>
            <div class="data-card">
              <div class="data-card-header">Auth server — registered client lookup</div>
              <pre>{
  <span class="key">"client_id"</span>:          <span class="val">"svc_billing_9x2k"</span>,
  <span class="key">"client_secret_hash"</span>: <span class="val">"$2b$12$hashed_value_stored_here"</span>,
  <span class="key">"allowed_grants"</span>:     <span class="val">["client_credentials"]</span>,
  <span class="key">"allowed_scopes"</span>:     <span class="val">["reports:read", "invoices:write", "invoices:read"]</span>,
  <span class="key">"token_lifetime"</span>:     <span class="val">3600</span>,
  <span class="key">"status"</span>:             <span class="val">"active"</span>
}</pre>
            </div>
          </div>

          <div class="callout">
            <span class="callout-icon">✅</span>
            <div class="callout-body">
              <strong>All checks passed — token will be issued</strong>
              The auth server now builds an access token scoped to <code>reports:read invoices:write</code> with the client's identity as the subject.
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
            <h2>Step 4 — Auth Server Returns the Access Token</h2>
            <p>The auth server responds with an access token. Notice what's missing compared to the PKCE flow: no refresh token, no ID token.</p>
          </div>

          <div class="section">
            <div class="section-title">Token response</div>
            <div class="data-card">
              <div class="data-card-header">200 OK — application/json
                <span class="direction-badge dir-receive">Received by service</span>
              </div>
              <pre>{
  <span class="key">"access_token"</span>: <span class="val">"eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiJzdmNfYmlsbGluZ185eDJrIiwic2NvcGUiOiJyZXBvcnRzOnJlYWQgaW52b2ljZXM6d3JpdGUiLCJleHAiOjE3NDU2MDAwMDB9.sig"</span>,
  <span class="comment">                  // JWT signed by the auth server's private key</span>

  <span class="key">"token_type"</span>:   <span class="val">"Bearer"</span>,

  <span class="key">"expires_in"</span>:   <span class="val">3600</span>,
  <span class="comment">                  // 1 hour — typically shorter-lived than user tokens</span>

  <span class="key">"scope"</span>:        <span class="val">"reports:read invoices:write"</span>
  <span class="comment">                  // Confirm what was actually granted (may differ from requested)</span>

  <span class="comment">// Note: no refresh_token — services just re-authenticate when the token expires</span>
  <span class="comment">// Note: no id_token — there is no user identity to assert</span>
}</pre>
            </div>
          </div>

          <div class="section">
            <div class="section-title">What's inside the JWT (decoded payload)</div>
            <div class="data-card">
              <div class="data-card-header">JWT Payload — decoded</div>
              <pre>{
  <span class="key">"iss"</span>:  <span class="val">"https://auth.example.com"</span>,      <span class="comment">// Issuer</span>
  <span class="key">"sub"</span>:  <span class="val">"svc_billing_9x2k"</span>,            <span class="comment">// Subject = the CLIENT, not a user</span>
  <span class="key">"aud"</span>:  <span class="val">"https://api.example.com"</span>,       <span class="comment">// Intended audience (the API)</span>
  <span class="key">"iat"</span>:  <span class="val">1745596400</span>,                    <span class="comment">// Issued at (Unix timestamp)</span>
  <span class="key">"exp"</span>:  <span class="val">1745600000</span>,                    <span class="comment">// Expires at</span>
  <span class="key">"scope"</span>: <span class="val">"reports:read invoices:write"</span>
}</pre>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Why no refresh token?</div>
            <div class="explanation-box">
              Refresh tokens exist to avoid making the user log in again. Since there's no user here, the service can simply <strong>re-authenticate with its credentials</strong> when the access token expires — one more POST to the token endpoint. This is cheap and safe, so a refresh token would add complexity with no benefit.
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
            <h2>Step 5 — Call the Protected API</h2>
            <p>The service uses the access token as a Bearer token in the Authorization header — identical to how a user-facing app would call an API.</p>
          </div>

          <div class="section">
            <div class="section-title">API request</div>
            <div class="data-card">
              <div class="data-card-header">POST https://api.example.com/v1/invoices
                <span class="direction-badge dir-send">Sent by service</span>
              </div>
              <pre>POST /v1/invoices HTTP/1.1
Host: api.example.com
Authorization: Bearer <span class="val">eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiJzdmNfYmlsbGluZ185eDJrIi...</span>
Content-Type: application/json

{
  <span class="key">"customer_id"</span>: <span class="val">"cust_4891"</span>,
  <span class="key">"amount"</span>:      <span class="val">1250.00</span>,
  <span class="key">"currency"</span>:    <span class="val">"USD"</span>
}</pre>
            </div>
          </div>

          <div class="section">
            <div class="section-title">How the API validates the token</div>
            <div class="explanation-box">
              <ul>
                <li>Checks the <span class="hl-green">Authorization: Bearer</span> header is present</li>
                <li>Verifies the JWT signature using the auth server's <strong>public key</strong> (fetched once from the JWKS endpoint)</li>
                <li>Checks <code>exp</code> — token must not be expired</li>
                <li>Checks <code>aud</code> — must match this API's identifier</li>
                <li>Checks <code>scope</code> — <code>invoices:write</code> must be present for this endpoint</li>
                <li>Reads <code>sub</code> to know <em>which service</em> made the call (for audit logging)</li>
              </ul>
            </div>
          </div>

          <div class="section">
            <div class="section-title">API response</div>
            <div class="data-card">
              <div class="data-card-header">201 Created
                <span class="direction-badge dir-receive">Received by service</span>
              </div>
              <pre>{
  <span class="key">"invoice_id"</span>:  <span class="val">"inv_00892"</span>,
  <span class="key">"status"</span>:      <span class="val">"created"</span>,
  <span class="key">"created_by"</span>:  <span class="val">"svc_billing_9x2k"</span>
  <span class="comment">               // The API logs the client service identity, not a user</span>
}</pre>
            </div>
          </div>
        `
    },
    {
      title: 'Token Expiry & Re-auth',
      actor: 'Client Service',
      actorLabel: 'Client Service',
      actorClass: 'actor-client',
      content: () => `
          <div class="step-header">
            <span class="actor-badge actor-client">Client Service</span>
            <h2>Step 6 — Handle Token Expiry</h2>
            <p>When the access token expires, the service simply requests a new one. No user interaction, no refresh token — just another POST with its credentials.</p>
          </div>

          <div class="section">
            <div class="section-title">Recommended token management strategy</div>
            <div class="explanation-box">
              There are two common patterns:
              <ul>
                <li><span class="hl-green">Proactive refresh</span> — re-authenticate before the token expires. Cache the token and track <code>expires_in</code>. Re-request ~60 seconds before expiry.</li>
                <li><span class="highlight">Reactive refresh</span> — try the API call; if you get a <code>401 Unauthorized</code>, re-authenticate and retry once.</li>
              </ul>
              <br>
              Proactive is preferred for high-throughput services — avoids failed API calls mid-flight.
            </div>
          </div>

          <div class="section">
            <div class="section-title">Re-authentication request (identical to Step 2)</div>
            <div class="data-card">
              <div class="data-card-header">POST https://auth.example.com/oauth/token
                <span class="direction-badge dir-send">Sent by service</span>
              </div>
              <pre>Authorization: Basic <span class="val">c3ZjX2JpbGxpbmdfOXgyazpza19wcm9kX1h2N21OM3BROHJMdDJ3Szl5QmRGNWpIY0FlVW8=</span>
Content-Type: application/x-www-form-urlencoded

<span class="key">grant_type</span> = <span class="val">client_credentials</span>
<span class="key">scope</span>      = <span class="val">reports:read invoices:write</span>
<span class="comment">// Same request as before — auth server issues a fresh token</span></pre>
            </div>
          </div>

          <div class="callout">
            <span class="callout-icon">⚡</span>
            <div class="callout-body">
              <strong>Cache your tokens</strong>
              Don't request a new token on every API call — that's wasteful and will likely get you rate-limited. Store the token in memory and reuse it until it's close to expiry.
            </div>
          </div>

          <div class="section">
            <div class="section-title">Pseudocode: token caching pattern</div>
            <div class="data-card">
              <div class="data-card-header">Service implementation pattern</div>
              <pre><span class="comment">// In-memory token cache</span>
<span class="key">let</span> cachedToken = <span class="val">null</span>;
<span class="key">let</span> tokenExpiresAt = <span class="val">0</span>;

<span class="key">async function</span> getAccessToken() {
  <span class="key">const</span> now = Date.now() / 1000;
  <span class="comment">// Re-fetch if missing or expiring within 60s</span>
  <span class="key">if</span> (!cachedToken || now > tokenExpiresAt - 60) {
    <span class="key">const</span> res = <span class="key">await</span> fetchNewToken();
    cachedToken   = res.access_token;
    tokenExpiresAt = now + res.expires_in;
  }
  <span class="key">return</span> cachedToken;
}</pre>
            </div>
          </div>
        `
    }
  ]
};
