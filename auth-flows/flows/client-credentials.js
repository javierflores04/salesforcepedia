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
            <p>A server-to-server flow with no user, no browser, no redirect. A backend service authenticates using its own credentials and gets an access token to call other services. Salesforce added support for this flow as of <strong>Winter '23</strong>.</p>
          </div>

          ${buildActorsLegend('clientcredentials')}

          <div class="section">
            <div class="section-title">Salesforce prerequisites</div>
            <div class="explanation-box">
              <ul>
                <li><span class="highlight">Connected App required</span> — Salesforce must be configured as the authorization server via a Connected App.</li>
                <li><span class="hl-yellow">Execution user must be selected</span> — unlike generic OAuth Client Credentials, Salesforce requires an <strong>execution user</strong> to be configured in the Connected App. This user determines the running context and permissions for all integration activity. The flow is not truly userless in Salesforce.</li>
                <li><span class="hl-green">Available since Winter '23</span> — Salesforce only started supporting this flow as a server in the Winter '23 release.</li>
              </ul>
            </div>
            <div class="callout">
              <span class="callout-icon">⚠️</span>
              <div class="callout-body">
                <strong>Not truly userless in Salesforce</strong>
                All integration activity runs under the execution user's permissions. Choose this user carefully — it defines what the integration can and cannot access.
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">When to use this flow</div>
            <div class="explanation-box">
              Use Client Credentials when there is <strong>no interactive user involved</strong>:
              <ul>
                <li>A <span class="hl-green">nightly sync</span> job between an external system and Salesforce</li>
                <li>A <span class="hl-green">microservice</span> calling the Salesforce REST API on a schedule</li>
                <li>A <span class="hl-green">data pipeline</span> reading or writing Salesforce records automatically</li>
              </ul>
              <br>
              The client is a <span class="highlight">confidential client</span> — it runs on a server you control and can safely store a <span class="hl-yellow">client_secret</span>.
              <br><br>
              Note: <span class="hl-green">Salesforce can also act as the client</span> — making outbound calls to external services using this flow.
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
              <pre><span class="key">client_id</span>      = <span class="val">"3MVG9_e4Xi_jbp1OtHHf_LvkL2pqYwxMzFzHmKH8Qx2R"</span>
<span class="comment">                 // Connected App's Consumer Key</span>

<span class="key">client_secret</span>  = <span class="val">"ABC123DEF456GHI789JKL012MNO345PQR"</span>
<span class="comment">                 // Connected App's Consumer Secret</span>
<span class="comment">                 // NEVER hardcode — store in a secrets manager</span>

<span class="key">token_endpoint</span> = <span class="val">"https://login.salesforce.com/services/oauth2/token"</span>
<span class="comment">                 // Use test.salesforce.com for sandboxes</span></pre>
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
              <div class="data-card-header">POST https://login.salesforce.com/services/oauth2/token
                <span class="direction-badge dir-send">Sent by service</span>
              </div>
              <pre>POST /services/oauth2/token HTTP/1.1
Host: login.salesforce.com
Content-Type: application/x-www-form-urlencoded

<span class="key">grant_type</span>     = <span class="val">client_credentials</span>
<span class="comment">                 // No user context — service authenticates as itself</span>

<span class="key">client_id</span>      = <span class="val">3MVG9_e4Xi_jbp1OtHHf_LvkL2pqYwxMzFzHmKH8Qx2R</span>
<span class="comment">                 // Consumer Key — sent in the request body for Salesforce</span>

<span class="key">client_secret</span>  = <span class="val">ABC123DEF456GHI789JKL012MNO345PQR</span>
<span class="comment">                 // Consumer Secret — sent in the request body for Salesforce</span>
<span class="comment">                 // (Salesforce does not require Basic Auth header for this flow)</span></pre>
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
                <li>No <span class="highlight">scope</span> parameter needed — Salesforce uses the execution user's permissions to determine access</li>
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
            <div class="section-title">What Salesforce checks</div>
            <div class="explanation-box">
              <ul>
                <li><span class="hl-green">Consumer Key exists</span> — looks up the Connected App by client_id</li>
                <li><span class="hl-green">Consumer Secret matches</span> — verifies the provided secret against the stored value</li>
                <li><span class="highlight">Connected App is active</span> — not blocked or disabled</li>
                <li><span class="hl-yellow">Grant type is enabled</span> — Client Credentials must be enabled on the Connected App</li>
                <li><span class="hl-yellow">Execution user is configured</span> — Salesforce looks up the execution user set on the Connected App; this user's permissions govern all API access</li>
              </ul>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Salesforce Connected App internal record</div>
            <div class="data-card">
              <div class="data-card-header">Salesforce — Connected App lookup</div>
              <pre>{
  <span class="key">"consumer_key"</span>:     <span class="val">"3MVG9_e4Xi_jbp1OtHHf_LvkL2pqYwxMzFzHmKH8Qx2R"</span>,
  <span class="key">"consumer_secret"</span>:  <span class="val">"[hashed]"</span>,
  <span class="key">"oauth_flows"</span>:      <span class="val">["client_credentials"]</span>,
  <span class="key">"execution_user"</span>:   <span class="val">"integration.user@myorg.com"</span>,
  <span class="comment">                     // ⭐ Salesforce-specific: this user's profile &amp; permissions apply</span>
  <span class="key">"status"</span>:           <span class="val">"active"</span>
}</pre>
            </div>
          </div>

          <div class="callout">
            <span class="callout-icon">✅</span>
            <div class="callout-body">
              <strong>All checks passed — token will be issued</strong>
              Salesforce issues an access token scoped to the execution user's permissions. The token represents the integration running as that user.
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
  <span class="key">"access_token"</span>:  <span class="val">"eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiJodHRwczovL2xvZ2luLnNhbGVzZm9yY2UuY29tL2lkLy4uLiIsImV4cCI6MTc0NTYwMDAwMH0.sig"</span>,
  <span class="comment">                   // Bearer token for Salesforce API calls</span>

  <span class="key">"token_type"</span>:    <span class="val">"Bearer"</span>,

  <span class="key">"instance_url"</span>:  <span class="val">"https://myinstance.salesforce.com"</span>,
  <span class="comment">                   // ⭐ Salesforce-specific: use this as the host for all API calls</span>

  <span class="key">"id"</span>:            <span class="val">"https://login.salesforce.com/id/00Dax0000000001EAA/005x0000000xxxxAAA"</span>,
  <span class="comment">                   // ⭐ Salesforce-specific: Identity URL — contains org ID and execution user ID</span>

  <span class="key">"issued_at"</span>:     <span class="val">"1745596400579"</span>
  <span class="comment">                   // ⭐ Salesforce-specific: token issuance timestamp (milliseconds)</span>

  <span class="comment">// Note: no refresh_token — re-authenticate with credentials when token expires</span>
  <span class="comment">// Note: no id_token — no interactive user, no OIDC identity assertion</span>
  <span class="comment">// Note: no expires_in — Salesforce does not return this field for client credentials</span>
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
              <div class="data-card-header">GET https://myinstance.salesforce.com/services/data/v60.0/sobjects/Account
                <span class="direction-badge dir-send">Sent by service</span>
              </div>
              <pre>GET /services/data/v60.0/sobjects/Account HTTP/1.1
Host: myinstance.salesforce.com
<span class="comment">// ⭐ Use instance_url from the token response — not login.salesforce.com</span>
Authorization: Bearer <span class="val">eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiJodHRwczovL2xvZ2luLnNhbGVzZm9yY2UuY29tL2lkLy4uLiIs...</span></pre>
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
              <div class="data-card-header">POST https://login.salesforce.com/services/oauth2/token
                <span class="direction-badge dir-send">Sent by service</span>
              </div>
              <pre>Content-Type: application/x-www-form-urlencoded

<span class="key">grant_type</span>     = <span class="val">client_credentials</span>
<span class="key">client_id</span>      = <span class="val">3MVG9_e4Xi_jbp1OtHHf_LvkL2pqYwxMzFzHmKH8Qx2R</span>
<span class="key">client_secret</span>  = <span class="val">ABC123DEF456GHI789JKL012MNO345PQR</span>
<span class="comment">// Identical to Step 2 — Salesforce issues a fresh token</span></pre>
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
