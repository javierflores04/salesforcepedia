window.flows.pkce = {
  title: 'Authorization Code Flow + PKCE',
  steps: [
    {
      title: 'Overview',
      actor: 'intro',
      actorLabel: 'Introduction',
      actorClass: 'actor-client',
      content: () => `
          <div class="step-header">
            <span class="actor-badge actor-client">Introduction</span>
            <h2>Authorization Code Flow + PKCE</h2>
            <p>Recommended since 2017 for mobile and native apps, PKCE (Proof Key for Code Exchange) is the secure way for public clients to obtain tokens without a client secret. Tokens are returned through a secure HTTPS back-channel — not via the browser URL.</p>
          </div>

          ${buildActorsLegend('pkce')}

          <div class="section">
            <div class="section-title">Salesforce prerequisites</div>
            <div class="explanation-box">
              <ul>
                <li><span class="highlight">Connected App required</span> — Salesforce must be configured as the authorization server via a Connected App.</li>
                <li><span class="hl-yellow">Disable "Require Secret for Web Server Flow"</span> — this setting must be <strong>turned off</strong> in the Connected App to allow PKCE without a client secret.</li>
              </ul>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Why PKCE?</div>
            <div class="explanation-box">
              Public clients can't safely store a <span class="highlight">client secret</span>. Anyone could extract it from JavaScript or a mobile binary.
              <br><br>
              PKCE solves this with a one-time <span class="highlight">cryptographic proof</span> per authorization request:
              <ul>
                <li>The app generates a random <span class="hl-green">code_verifier</span> (128-byte base64url string)</li>
                <li>It hashes it to create a <span class="hl-yellow">code_challenge</span> — sent upfront to Salesforce</li>
                <li>When exchanging the code for tokens, it sends the raw <span class="hl-green">code_verifier</span></li>
                <li>Salesforce verifies the hash matches — proving the same app started and finished the flow</li>
              </ul>
            </div>
            <div class="callout">
              <span class="callout-icon">🔒</span>
              <div class="callout-body">
                <strong>Attack prevented</strong>
                If an attacker intercepts the authorization code, they can't use it — they don't have the <code>code_verifier</code> that only your app holds.
              </div>
            </div>
          </div>
        `
    },
    {
      title: 'Generate PKCE Pair',
      actor: 'Client App',
      actorLabel: 'Client App',
      actorClass: 'actor-client',
      content: () => `
          <div class="step-header">
            <span class="actor-badge actor-client">Client App</span>
            <h2>Step 1 — Generate PKCE Code Verifier & Challenge</h2>
            <p>Before redirecting the user, the app generates a cryptographic pair. This all happens locally in the app — nothing is sent to the server yet.</p>
          </div>

          <div class="section">
            <div class="section-title">What the app generates</div>

            <div class="data-card">
              <div class="data-card-header">
                Code Verifier
                <span class="direction-badge dir-generate">Generated locally</span>
              </div>
              <pre><span class="key">code_verifier</span> = <span class="val">"${SIM.codeVerifier}"</span>

<span class="comment">// A cryptographically random 128-byte base64url encoded string</span>
<span class="comment">// Generated using: crypto.getRandomValues()</span>
<span class="comment">// URL-safe base64 encoding, no padding characters</span></pre>
            </div>

            <div class="data-card">
              <div class="data-card-header">
                Code Challenge
                <span class="direction-badge dir-generate">Derived from verifier</span>
              </div>
              <pre><span class="key">code_challenge</span> = BASE64URL( SHA256( <span class="val">"${SIM.codeVerifier}"</span> ) )
             = <span class="val">"${SIM.codeChallenge}"</span>

<span class="key">code_challenge_method</span> = <span class="val">"S256"</span>
<span class="comment">// S256 = SHA-256 hashed. Always prefer S256 over "plain".</span></pre>
            </div>
          </div>

          <div class="section">
            <div class="section-title">How it works</div>
            <div class="explanation-box">
              <ul>
                <li>The <span class="hl-green">code_verifier</span> is like a password — kept secret in memory, <strong>never sent until the token exchange</strong></li>
                <li>The <span class="hl-yellow">code_challenge</span> is the SHA-256 hash of the verifier, base64url-encoded — safe to send publicly</li>
                <li>SHA-256 is one-way: you can't reverse the challenge back to the verifier</li>
              </ul>
            </div>
            <div class="callout">
              <span class="callout-icon">💡</span>
              <div class="callout-body">
                <strong>Only the challenge leaves the device in this step</strong>
                The verifier stays in memory (or sessionStorage) and is only used in Step 5.
              </div>
            </div>
          </div>
        `
    },
    {
      title: 'Build Authorization URL',
      actor: 'Client App',
      actorLabel: 'Client App',
      actorClass: 'actor-client',
      content: () => `
          <div class="step-header">
            <span class="actor-badge actor-client">Client App</span>
            <h2>Step 2 — Build the Authorization Request URL</h2>
            <p>The app constructs a URL to redirect the user's browser to the authorization server's login page.</p>
          </div>

          <div class="section">
            <div class="section-title">Authorization URL (constructed by the app)</div>
            <div class="data-card">
              <div class="data-card-header">GET Request — Browser redirect to Salesforce</div>
              <pre><span class="url">${SIM.authEndpoint}</span>?

  <span class="key">response_type</span>         = <span class="val">code</span>
  <span class="comment">                        // "code" tells Salesforce to return an auth code</span>

  <span class="key">client_id</span>             = <span class="val">${SIM.clientId}</span>
  <span class="comment">                        // Connected App's Consumer Key</span>

  <span class="key">redirect_uri</span>          = <span class="val">${SIM.redirectUri}</span>
  <span class="comment">                        // Must exactly match the Callback URL in the Connected App</span>

  <span class="key">scope</span>                 = <span class="val">${SIM.scope}</span>
  <span class="comment">                        // Salesforce scopes: api (REST API), refresh_token, openid</span>

  <span class="key">state</span>                 = <span class="val">${SIM.state}</span>
  <span class="comment">                        // Random value stored locally; verified on callback to prevent CSRF</span>

  <span class="key">code_challenge</span>        = <span class="val">${SIM.codeChallenge}</span>
  <span class="comment">                        // base64url(SHA256(code_verifier)) from Step 1</span>

  <span class="key">code_challenge_method</span> = <span class="val">S256</span></pre>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Parameter breakdown</div>
            <div class="explanation-box">
              <ul>
                <li><span class="hl-green">response_type=code</span> — request an authorization code, not a token directly</li>
                <li><span class="highlight">client_id</span> — the Connected App's <strong>Consumer Key</strong></li>
                <li><span class="highlight">redirect_uri</span> — must exactly match the Callback URL registered in the Connected App</li>
                <li><span class="highlight">scope</span> — Salesforce uses <code>api</code> for REST API access, <code>refresh_token</code> to receive a refresh token, <code>openid</code> for identity</li>
                <li><span class="hl-yellow">state</span> — random value; verified on callback to prevent CSRF attacks</li>
                <li><span class="hl-green">code_challenge</span> — the PKCE hash from Step 1; Salesforce stores it and verifies it in Step 5</li>
              </ul>
            </div>
          </div>
        `
    },
    {
      title: 'User Logs In',
      actor: 'User / Browser',
      actorLabel: 'User / Browser',
      actorClass: 'actor-browser',
      content: () => `
          <div class="step-header">
            <span class="actor-badge actor-browser">User / Browser</span>
            <h2>Step 3 — User Authenticates & Consents</h2>
            <p>The browser is redirected to the auth server. The user logs in and reviews the consent screen. This all happens on the auth server — your app has no involvement here.</p>
          </div>

          <div class="section">
            <div class="section-title">What the auth server does</div>
            <div class="explanation-box">
              <ul>
                <li>Receives the authorization URL parameters (including the <span class="hl-green">code_challenge</span>)</li>
                <li>Presents a <strong>login form</strong> to the user</li>
                <li>After successful login, presents a <strong>consent screen</strong> listing the requested scopes</li>
                <li>Stores the <span class="hl-green">code_challenge</span> alongside a newly generated authorization code</li>
                <li>Redirects the browser back to <span class="hl-yellow">redirect_uri</span> with the code and state</li>
              </ul>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Simulated login</div>
            <div class="data-card">
              <div class="data-card-header">User credentials entered (on auth server — app never sees these)</div>
              <pre><span class="key">username</span>  = <span class="val">"${SIM.user.email}"</span>
<span class="key">password</span>  = <span class="val">"••••••••"</span>   <span class="comment">// Never exposed to the client app</span>

<span class="comment">// User clicks "Allow" on consent screen for scopes:</span>
<span class="key">scopes approved</span> = <span class="val">openid, profile, email</span></pre>
            </div>
          </div>

          <div class="section">
            <div class="section-title">What the auth server stores internally</div>
            <div class="data-card">
              <div class="data-card-header">Auth server — internal record (not visible to client)</div>
              <pre><span class="key">authorization_code</span>    = <span class="val">"${SIM.authCode}"</span>
<span class="key">code_challenge</span>        = <span class="val">"${SIM.codeChallenge}"</span>  <span class="comment">// Saved for Step 5 verification</span>
<span class="key">code_challenge_method</span> = <span class="val">"S256"</span>
<span class="key">client_id</span>             = <span class="val">"${SIM.clientId}"</span>
<span class="key">redirect_uri</span>          = <span class="val">"${SIM.redirectUri}"</span>
<span class="key">expires_at</span>            = <span class="val">now + 60 seconds</span>  <span class="comment">// Codes are very short-lived</span></pre>
            </div>
          </div>

          <div class="callout">
            <span class="callout-icon">🛡️</span>
            <div class="callout-body">
              <strong>Your app never sees the password</strong>
              This is the core value of OAuth — the user authenticates directly with the identity provider. Your app only ever receives tokens.
            </div>
          </div>
        `
    },
    {
      title: 'Receive Auth Code',
      actor: 'Client App',
      actorLabel: 'Client App',
      actorClass: 'actor-client',
      content: () => `
          <div class="step-header">
            <span class="actor-badge actor-client">Client App</span>
            <h2>Step 4 — App Receives the Authorization Code</h2>
            <p>The auth server redirects the browser back to your app with a short-lived authorization code in the URL. Your app validates the state and prepares to exchange the code.</p>
          </div>

          <div class="section">
            <div class="section-title">Callback URL received by the app</div>
            <div class="data-card">
              <div class="data-card-header">Incoming redirect to redirect_uri
                <span class="direction-badge dir-receive">Received</span>
              </div>
              <pre><span class="url">${SIM.redirectUri}</span>?

  <span class="key">code</span>   = <span class="val">${SIM.authCode}</span>
  <span class="comment">         // Short-lived, single-use authorization code</span>

  <span class="key">state</span>  = <span class="val">${SIM.state}</span>
  <span class="comment">         // App MUST verify this matches what was sent in Step 2</span></pre>
            </div>
          </div>

          <div class="section">
            <div class="section-title">What the app does with this</div>
            <div class="explanation-box">
              <ul>
                <li><strong>Verify state</strong> — compare the received <span class="hl-yellow">state</span> with the value stored before the redirect. If they don't match, abort — possible CSRF attack.</li>
                <li><strong>Extract the code</strong> — store it briefly; it will be used immediately in the next step</li>
                <li><strong>Do NOT use the code directly</strong> — it's not a token; it must be exchanged</li>
              </ul>
            </div>
            <div class="callout">
              <span class="callout-icon">⚠️</span>
              <div class="callout-body">
                <strong>Authorization codes expire fast</strong>
                Typically within 60 seconds. If an attacker intercepts the code, they still can't use it without the <code>code_verifier</code> that only your app holds.
              </div>
            </div>
          </div>
        `
    },
    {
      title: 'Exchange Code for Tokens',
      actor: 'Client App',
      actorLabel: 'Client App',
      actorClass: 'actor-client',
      content: () => `
          <div class="step-header">
            <span class="actor-badge actor-client">Client App</span>
            <h2>Step 5 — Exchange the Code for Tokens</h2>
            <p>The app makes a direct POST request to the token endpoint — this is a back-channel request (server-to-server or app-to-server, not via browser redirect). Here the PKCE verifier is finally revealed.</p>
          </div>

          <div class="section">
            <div class="section-title">Token request (POST)</div>
            <div class="data-card">
              <div class="data-card-header">
                POST ${SIM.tokenEndpoint}
                <span class="direction-badge dir-send">Sent by app</span>
              </div>
              <pre>Content-Type: application/x-www-form-urlencoded

<span class="key">grant_type</span>     = <span class="val">authorization_code</span>
<span class="key">code</span>           = <span class="val">${SIM.authCode}</span>
<span class="key">redirect_uri</span>   = <span class="val">${SIM.redirectUri}</span>
<span class="key">client_id</span>      = <span class="val">${SIM.clientId}</span>

<span class="key">code_verifier</span>  = <span class="val">${SIM.codeVerifier}</span>
<span class="comment">                 // The original random string from Step 1</span>
<span class="comment">                 // Server will SHA-256 hash this and compare to stored challenge</span></pre>
            </div>
          </div>

          <div class="section">
            <div class="section-title">What the auth server verifies</div>
            <div class="explanation-box">
              <ul>
                <li>Looks up the <span class="hl-green">authorization_code</span> — must exist and not be expired</li>
                <li>Hashes the received <span class="hl-green">code_verifier</span> with SHA-256</li>
                <li>Compares result to the stored <span class="hl-yellow">code_challenge</span> from Step 2</li>
                <li>If they match — issues tokens. If not — rejects with error.</li>
                <li>Invalidates the code (one-time use)</li>
              </ul>
            </div>
          </div>

          <div class="callout">
            <span class="callout-icon">🔑</span>
            <div class="callout-body">
              <strong>This is the PKCE proof moment</strong>
              The server is verifying: "the party requesting tokens is the same one that started the flow" — because only they know the verifier that hashes to the stored challenge.
            </div>
          </div>
        `
    },
    {
      title: 'Receive Tokens',
      actor: 'Auth Server',
      actorLabel: 'Auth Server',
      actorClass: 'actor-authserver',
      content: () => `
          <div class="step-header">
            <span class="actor-badge actor-authserver">Auth Server</span>
            <h2>Step 6 — Auth Server Returns Tokens</h2>
            <p>After verifying the PKCE challenge, the auth server returns an access token, optionally a refresh token, and (if openid scope was requested) an ID token.</p>
          </div>

          <div class="section">
            <div class="section-title">Token response</div>
            <div class="data-card">
              <div class="data-card-header">
                200 OK — application/json
                <span class="direction-badge dir-receive">Received by app</span>
              </div>
              <pre>{
  <span class="key">"access_token"</span>:  <span class="val">"${SIM.accessToken}"</span>,
  <span class="comment">                   // Bearer token — used to call Salesforce APIs</span>

  <span class="key">"token_type"</span>:    <span class="val">"Bearer"</span>,

  <span class="key">"refresh_token"</span>: <span class="val">"${SIM.refreshToken}"</span>,
  <span class="comment">                   // Issued because refresh_token scope was requested</span>

  <span class="key">"id_token"</span>:      <span class="val">"${SIM.idToken}"</span>,
  <span class="comment">                   // JWT with user identity claims (openid scope)</span>

  <span class="key">"scope"</span>:         <span class="val">"${SIM.scope}"</span>,

  <span class="key">"instance_url"</span>:  <span class="val">"${SIM.instanceUrl}"</span>,
  <span class="comment">                   // ⭐ Salesforce-specific: the org's base URL for API calls</span>

  <span class="key">"id"</span>:            <span class="val">"${SIM.userId}"</span>,
  <span class="comment">                   // ⭐ Salesforce-specific: URL to the Identity Service for this user</span>

  <span class="key">"issued_at"</span>:     <span class="val">"${SIM.issuedAt}"</span>
  <span class="comment">                   // ⭐ Salesforce-specific: Unix timestamp (milliseconds) of token issuance</span>
}</pre>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Token fields explained</div>
            <div class="explanation-box">
              <ul>
                <li><span class="hl-green">access_token</span> — Bearer token for Salesforce API calls. Short-lived.</li>
                <li><span class="hl-yellow">refresh_token</span> — longer-lived. Used to get a new access token without re-login. Only issued if <code>refresh_token</code> was in scope.</li>
                <li><span class="highlight">id_token</span> — JWT with user identity claims. Only issued if <code>openid</code> was in scope. For identity only — not for API calls.</li>
                <li><span class="hl-green">instance_url</span> — <strong>Salesforce-specific</strong>. The base URL of your org (e.g. <code>https://myinstance.salesforce.com</code>). Use this as the host for all API calls.</li>
                <li><span class="highlight">id</span> — <strong>Salesforce-specific</strong>. URL to the Identity Service endpoint for the authenticated user. Contains org ID and user ID.</li>
                <li><span class="hl-yellow">issued_at</span> — <strong>Salesforce-specific</strong>. Token issuance timestamp in Unix milliseconds.</li>
              </ul>
            </div>
          </div>
        `
    },
    {
      title: 'Call Protected API',
      actor: 'Client App',
      actorLabel: 'Client App',
      actorClass: 'actor-client',
      content: () => `
          <div class="step-header">
            <span class="actor-badge actor-client">Client App</span>
            <h2>Step 7 — Call a Protected API with the Access Token</h2>
            <p>Now the app uses the access token to make authenticated requests to the resource server (API).</p>
          </div>

          <div class="section">
            <div class="section-title">API request</div>
            <div class="data-card">
              <div class="data-card-header">
                GET ${SIM.resourceApi}
                <span class="direction-badge dir-send">Sent by app</span>
              </div>
              <pre>GET /services/data/v60.0/sobjects/Account HTTP/1.1
Host: myinstance.salesforce.com
<span class="comment">// ⭐ Use instance_url from the token response as the host — not login.salesforce.com</span>
Authorization: Bearer <span class="val">${SIM.accessToken}</span></pre>
            </div>
          </div>

          <div class="section">
            <div class="section-title">API response</div>
            <div class="data-card">
              <div class="data-card-header">
                200 OK
                <span class="direction-badge dir-receive">Received by app</span>
              </div>
              <pre>{
  <span class="key">"sub"</span>:    <span class="val">"${SIM.user.sub}"</span>,
  <span class="key">"name"</span>:   <span class="val">"${SIM.user.name}"</span>,
  <span class="key">"email"</span>:  <span class="val">"${SIM.user.email}"</span>
}</pre>
            </div>
          </div>

          <div class="section">
            <div class="section-title">How the API validates the token</div>
            <div class="explanation-box">
              <ul>
                <li>API receives the Bearer token and validates it (signature check, expiry, issuer, audience)</li>
                <li>If the token is a JWT — the API can validate it locally without calling the auth server</li>
                <li>If the token is opaque — the API calls the auth server's introspection endpoint</li>
                <li>After validation, the API returns the protected data</li>
              </ul>
            </div>
          </div>
        `
    },
    {
      title: 'Refresh the Token',
      actor: 'Client App',
      actorLabel: 'Client App',
      actorClass: 'actor-client',
      content: () => `
          <div class="step-header">
            <span class="actor-badge actor-client">Client App</span>
            <h2>Step 8 — Refresh the Access Token</h2>
            <p>When the access token expires, the app uses the refresh token to get a new one silently — no user interaction needed.</p>
          </div>

          <div class="section">
            <div class="section-title">Refresh request</div>
            <div class="data-card">
              <div class="data-card-header">
                POST ${SIM.tokenEndpoint}
                <span class="direction-badge dir-send">Sent by app</span>
              </div>
              <pre>Content-Type: application/x-www-form-urlencoded

<span class="key">grant_type</span>     = <span class="val">refresh_token</span>
<span class="key">refresh_token</span>  = <span class="val">${SIM.refreshToken}</span>
<span class="key">client_id</span>      = <span class="val">${SIM.clientId}</span>
<span class="comment">// No code_verifier needed for refresh — PKCE is only for the initial code exchange</span></pre>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Response</div>
            <div class="data-card">
              <div class="data-card-header">200 OK — New tokens issued
                <span class="direction-badge dir-receive">Received by app</span>
              </div>
              <pre>{
  <span class="key">"access_token"</span>:  <span class="val">"eyJhbGciOiJSUzI1NiJ9.NEW_TOKEN.sig"</span>,
  <span class="key">"token_type"</span>:    <span class="val">"Bearer"</span>,
  <span class="key">"expires_in"</span>:    <span class="val">3600</span>,
  <span class="key">"refresh_token"</span>: <span class="val">"NEW_REFRESH_TOKEN_abc123"</span>
  <span class="comment">                   // Auth servers often rotate refresh tokens — store the new one!</span>
}</pre>
            </div>
          </div>

          <div class="callout">
            <span class="callout-icon">♻️</span>
            <div class="callout-body">
              <strong>Refresh token rotation</strong>
              Many auth servers issue a new refresh token with each refresh. Always replace the stored refresh token with the latest one — old ones are invalidated.
            </div>
          </div>
        `
    }
  ]
};
