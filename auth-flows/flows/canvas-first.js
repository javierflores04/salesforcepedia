window.flows.canvasfirst = {
  title: 'Canvas: Self-Authorization',
  steps: [
    {
      title: 'Overview',
      actor: 'intro',
      actorLabel: 'Introduction',
      actorClass: 'actor-client',
      content: () => `
          <div class="step-header">
            <span class="actor-badge actor-client">Introduction</span>
            <h2>Canvas App — Self-Authorization</h2>
            <p>When <strong>Permitted Users</strong> is set to <em>"All users may self-authorize"</em>, users can authorize themselves the first time they open the canvas app. Salesforce checks for a prior valid approval. If none exists, it initiates an OAuth flow <em>through</em> the canvas app to collect consent and obtain an access token — then generates the signed request.</p>
          </div>

          ${buildActorsLegend('canvasfirst')}

          <div class="section">
            <div class="section-title">Two sub-paths within self-authorization</div>
            <div class="explanation-box">
              <ul>
                <li><span class="hl-green">Prior valid approval exists</span> — Salesforce POSTs the signed request directly, same as the admin pre-authorized path. No OAuth flow.</li>
                <li><span class="highlight">No prior approval (this flow)</span> — Salesforce signals <code>user_approval_required</code>. The canvas app initiates an OAuth user-agent flow, collects consent, receives an access token, then calls <code>repost()</code> to exchange it for a signed request.</li>
              </ul>
            </div>
            <div class="callout">
              <span class="callout-icon">🔄</span>
              <div class="callout-body">
                <strong>One-time OAuth, then a signed request forever after</strong>
                Once the user approves, the approval is stored. All future sessions go through the fast path — Salesforce POSTs the signed request directly without repeating the OAuth flow.
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Why this flow is more complex</div>
            <div class="explanation-box">
              The canvas app itself must participate in the OAuth flow as a <strong>user-agent client</strong> to collect the user's access token. It does this through the Canvas SDK's <code>oauth.login()</code> method. After receiving the token, it calls <code>repost()</code> which communicates back to Salesforce via <code>postMessage</code> and a PUT to the Signed Request endpoint — Salesforce then generates and POSTs the final signed request.
            </div>
          </div>
        `
    },
    {
      title: 'Connected App Setup',
      actor: 'Canvas App',
      actorLabel: 'Canvas App',
      actorClass: 'actor-client',
      content: () => `
          <div class="step-header">
            <span class="actor-badge actor-client">Canvas App</span>
            <h2>Step 1 — Configure the Connected App</h2>
            <p>Same canvas setup as the admin pre-authorized path, but <strong>Permitted Users</strong> is set to <em>"All users may self-authorize"</em>. A Callback URL must be configured for the OAuth redirect.</p>
          </div>

          <div class="section">
            <div class="section-title">Connected app configuration</div>
            <div class="data-card">
              <div class="data-card-header">Setup → App Manager → New Connected App</div>
              <pre><span class="comment">// OAuth Settings:</span>
<span class="key">Enable OAuth Settings</span>:    <span class="val">✓</span>
<span class="key">Callback URL</span>:            <span class="val">https://canvas.example.com/callback</span>
<span class="comment">                          // ⚠️ Required — used in the OAuth redirect step</span>
<span class="key">Selected OAuth Scopes</span>:    <span class="val">api, refresh_token</span>

<span class="comment">// Canvas:</span>
<span class="key">Enable Canvas</span>:            <span class="val">✓</span>
<span class="key">Canvas App URL</span>:          <span class="val">https://canvas.example.com/app</span>
<span class="key">Access Method</span>:           <span class="val">Signed Request (POST)</span>
<span class="key">Locations</span>:               <span class="val">App Launcher, Chatter Tab, Visualforce Page...</span>

<span class="comment">// Policies:</span>
<span class="key">Permitted Users</span>:          <span class="val">All users may self-authorize</span>
<span class="comment">                          // Users with Salesforce access can approve the app themselves</span></pre>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Consumer Secret — your signing key</div>
            <div class="data-card">
              <div class="data-card-header">Connected App → Manage Consumer Details</div>
              <pre><span class="key">Consumer Key</span>:    <span class="val">3MVG9_e4Xi_jbp1OtHHf_LvkL2pqYwxMzFzHmKH8Qx2R</span>
<span class="key">Consumer Secret</span>: <span class="val">9F3C2D1A8E7B4062...</span>
<span class="comment">                 // Store server-side only</span></pre>
            </div>
          </div>
        `
    },
    {
      title: 'User Accesses Page',
      actor: 'User / Browser',
      actorLabel: 'User / Browser',
      actorClass: 'actor-user',
      content: () => `
          <div class="step-header">
            <span class="actor-badge actor-user">User / Browser</span>
            <h2>Step 2 — User Accesses the Page Containing the Canvas App</h2>
            <p>The user navigates to a Salesforce page that contains the canvas app. The browser sends a page request to Salesforce. Salesforce checks for a prior valid approval — and finds none.</p>
          </div>

          <div class="section">
            <div class="section-title">What Salesforce checks</div>
            <div class="explanation-box">
              <ol>
                <li>Permitted Users = "All users may self-authorize" ✓</li>
                <li>Does this user have a prior valid approval for this connected app?</li>
                <li><span class="hl-yellow">No prior approval found</span> → user approval required. Continue to next step.</li>
              </ol>
            </div>
          </div>
        `
    },
    {
      title: 'Canvas App Loaded with user_approval_required',
      actor: 'Salesforce',
      actorLabel: 'Salesforce',
      actorClass: 'actor-authserver',
      content: () => `
          <div class="step-header">
            <span class="actor-badge actor-authserver">Salesforce</span>
            <h2>Step 3 — Salesforce Signals: User Approval Required</h2>
            <p>Salesforce responds to the browser indicating that user approval is needed. The browser loads the canvas app URL inside an iframe, passing a special parameter that tells the canvas app to initiate the OAuth flow.</p>
          </div>

          <div class="section">
            <div class="section-title">Browser loads Canvas App in iframe with approval flag</div>
            <div class="data-card">
              <div class="data-card-header">Browser → Canvas App URL (inside Salesforce iframe)
                <span class="direction-badge dir-send">HTTP GET</span>
              </div>
              <pre>GET /app?<span class="key">_sfdc_canvas_authvalue</span>=<span class="val">user_approval_required</span> HTTP/1.1
Host: canvas.example.com

<span class="comment">// Salesforce embeds the canvas app in an iframe and passes this parameter</span>
<span class="comment">// The canvas app must detect this value and initiate the OAuth flow</span></pre>
            </div>
          </div>

          <div class="callout">
            <span class="callout-icon">ℹ️</span>
            <div class="callout-body">
              <strong><code>_sfdc_canvas_authvalue=user_approval_required</code></strong>
              This is Salesforce's signal to the canvas app that the user has not yet approved the connected app. The canvas app is responsible for detecting this and starting the OAuth user-agent flow.
            </div>
          </div>
        `
    },
    {
      title: 'Canvas App Initiates OAuth',
      actor: 'Canvas App',
      actorLabel: 'Canvas App',
      actorClass: 'actor-client',
      content: () => `
          <div class="step-header">
            <span class="actor-badge actor-client">Canvas App</span>
            <h2>Step 4 — Canvas App Detects Parameter and Initiates OAuth</h2>
            <p>The canvas app detects <code>_sfdc_canvas_authvalue=user_approval_required</code> and calls the Canvas SDK's <code>oauth.login()</code> method. This redirects the browser to Salesforce's Authorization endpoint to start a user-agent OAuth flow.</p>
          </div>

          <div class="section">
            <div class="section-title">Canvas App detects the parameter and calls oauth.login()</div>
            <div class="data-card">
              <div class="data-card-header">Canvas App server-side logic</div>
              <pre><span class="comment">// Detect the Salesforce signal</span>
if request.params.get('_sfdc_canvas_authvalue') == 'user_approval_required':
    <span class="comment"># Trigger the OAuth user-agent flow via Canvas SDK</span>
    <span class="comment"># oauth.login() redirects the browser to the Salesforce Authorization endpoint</span>
    canvas.oauth.login()</pre>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Browser is redirected to Salesforce Authorization endpoint</div>
            <div class="data-card">
              <div class="data-card-header">Browser → Salesforce Authorization endpoint
                <span class="direction-badge dir-send">HTTP GET (redirect)</span>
              </div>
              <pre>GET /services/oauth2/authorize HTTP/1.1
Host: login.salesforce.com

<span class="key">response_type</span> = <span class="val">token</span>
<span class="comment">               // User-agent flow — token returned in redirect URI fragment</span>
<span class="key">client_id</span>     = <span class="val">3MVG9_e4Xi_jbp1OtHHf_LvkL2pqYwxMzFzHmKH8Qx2R</span>
<span class="key">redirect_uri</span>  = <span class="val">https://canvas.example.com/callback</span></pre>
            </div>
          </div>
        `
    },
    {
      title: 'User Authorizes',
      actor: 'User / Browser',
      actorLabel: 'User / Browser',
      actorClass: 'actor-user',
      content: () => `
          <div class="step-header">
            <span class="actor-badge actor-user">User / Browser</span>
            <h2>Step 5 — Salesforce Shows Consent, User Authorizes</h2>
            <p>Salesforce displays the consent page showing the connected app's name and the requested scopes. The user reviews and clicks <strong>Allow</strong>. Salesforce records the approval and prepares to return the access token.</p>
          </div>

          <div class="section">
            <div class="section-title">Consent page</div>
            <div class="explanation-box">
              <ul>
                <li>Salesforce shows the connected app name, requested scopes, and Allow / Deny buttons</li>
                <li>User clicks <span class="hl-green">Allow</span> → approval stored, flow continues</li>
                <li>User clicks <span class="highlight">Deny</span> → no approval stored, flow stops, canvas app receives no token</li>
              </ul>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Salesforce returns the access token via redirect URI</div>
            <div class="data-card">
              <div class="data-card-header">Salesforce → Browser (redirect URI response)</div>
              <pre>HTTP/1.1 302 Found
Location: https://canvas.example.com/callback
  #<span class="key">access_token</span>=<span class="val">00Dax0000000001EAA!ARQAQKGnq...</span>
  &<span class="key">refresh_token</span>=<span class="val">5Aep8614...</span>
  &<span class="key">instance_url</span>=<span class="val">https://myinstance.salesforce.com</span>
  &<span class="key">token_type</span>=<span class="val">Bearer</span>

<span class="comment">// Tokens are in the URI fragment (#) — user-agent flow</span>
<span class="comment">// Fragment is accessible to the browser but not sent to the server in the GET</span></pre>
            </div>
          </div>
        `
    },
    {
      title: 'Browser Calls Callback URL',
      actor: 'User / Browser',
      actorLabel: 'User / Browser',
      actorClass: 'actor-user',
      content: () => `
          <div class="step-header">
            <span class="actor-badge actor-user">User / Browser</span>
            <h2>Step 6 — Browser Calls the Canvas App Callback URL</h2>
            <p>The browser follows the redirect and sends an HTTP GET to the canvas app's Callback URL. The access token and refresh token are included. The canvas app receives them and is now ready to request the signed request from Salesforce.</p>
          </div>

          <div class="section">
            <div class="section-title">Browser → Canvas App Callback URL</div>
            <div class="data-card">
              <div class="data-card-header">Browser → Canvas App Callback
                <span class="direction-badge dir-send">HTTP GET</span>
              </div>
              <pre>GET /callback
  #<span class="key">access_token</span>=<span class="val">00Dax0000000001EAA!ARQAQKGnq...</span>
  &<span class="key">refresh_token</span>=<span class="val">5Aep8614...</span>
  &<span class="key">instance_url</span>=<span class="val">https://myinstance.salesforce.com</span>
Host: canvas.example.com

<span class="comment">// Canvas app now holds the access_token and refresh_token</span>
<span class="comment">// Next: call repost() to exchange these for a signed request</span></pre>
            </div>
          </div>

          <div class="callout">
            <span class="callout-icon">🔑</span>
            <div class="callout-body">
              <strong>The canvas app has a token — but not yet a signed request</strong>
              The access token received here is a standard OAuth token. The canvas app must call <code>repost()</code> to ask Salesforce to generate a <em>signed request</em> containing this token embedded in the HMAC-protected context payload.
            </div>
          </div>
        `
    },
    {
      title: 'Canvas App Calls repost()',
      actor: 'Canvas App',
      actorLabel: 'Canvas App',
      actorClass: 'actor-client',
      content: () => `
          <div class="step-header">
            <span class="actor-badge actor-client">Canvas App</span>
            <h2>Step 7 — Canvas App Calls repost()</h2>
            <p>The canvas app calls the Canvas SDK's <code>repost()</code> method. This sends a <code>postMessage</code> to the parent Salesforce frame, which triggers an HTTP PUT to Salesforce's Signed Request endpoint asking it to generate a signed request for this user.</p>
          </div>

          <div class="section">
            <div class="section-title">repost() — the bridge back to Salesforce</div>
            <div class="data-card">
              <div class="data-card-header">Canvas App calls repost()</div>
              <pre><span class="comment">// Called after receiving the access token at the callback URL</span>
Sfdc.canvas.client.repost(signedRequest, {<span class="key">accessToken</span>: <span class="val">accessToken</span>});

<span class="comment">// What happens internally:</span>
<span class="comment">// 1. repost() sends a postMessage to the parent Salesforce iframe frame</span>
<span class="comment">// 2. The Salesforce frame sends an HTTP PUT to the Signed Request endpoint</span></pre>
            </div>
          </div>

          <div class="section">
            <div class="section-title">HTTP PUT to Salesforce Signed Request endpoint</div>
            <div class="data-card">
              <div class="data-card-header">iframe postMessage → HTTP PUT to Salesforce
                <span class="direction-badge dir-send">PUT request</span>
              </div>
              <pre>PUT /services/oauth2/canvas/repost HTTP/1.1
Host: myinstance.salesforce.com
Authorization: Bearer <span class="val">00Dax0000000001EAA!ARQAQKGnq...</span>

<span class="comment">// Salesforce receives the PUT, verifies the token,</span>
<span class="comment">// and generates a signed request for this user</span></pre>
            </div>
          </div>

          <div class="callout">
            <span class="callout-icon">📨</span>
            <div class="callout-body">
              <strong>postMessage as the bridge</strong>
              The canvas app runs in an iframe inside the Salesforce page. <code>repost()</code> uses the browser's <code>postMessage</code> API to communicate back to the parent Salesforce frame, which then makes the PUT call on behalf of the canvas app.
            </div>
          </div>
        `
    },
    {
      title: 'Salesforce Returns Signed Request',
      actor: 'Salesforce',
      actorLabel: 'Salesforce',
      actorClass: 'actor-authserver',
      content: () => `
          <div class="step-header">
            <span class="actor-badge actor-authserver">Salesforce</span>
            <h2>Step 8 — Salesforce Generates and POSTs the Signed Request</h2>
            <p>Salesforce receives the PUT, verifies the access token, generates the signed request (HMAC-SHA256 signed context), refreshes the canvas app inside the iframe, and POSTs the signed request to the canvas app URL.</p>
          </div>

          <div class="section">
            <div class="section-title">Salesforce responds to the PUT</div>
            <div class="data-card">
              <div class="data-card-header">Salesforce → iframe (PUT response + iframe refresh)</div>
              <pre><span class="comment">// Salesforce responds to the PUT with the signed request</span>
<span class="comment">// Then refreshes the canvas app iframe</span>
<span class="comment">// The iframe refresh triggers a new POST to the canvas app URL</span></pre>
            </div>
          </div>

          <div class="section">
            <div class="section-title">The final POST — signed_request delivered</div>
            <div class="data-card">
              <div class="data-card-header">POST https://canvas.example.com/app
                <span class="direction-badge dir-send">Sent by Salesforce</span>
              </div>
              <pre>POST /app HTTP/1.1
Host: canvas.example.com
Content-Type: application/x-www-form-urlencoded

<span class="key">signed_request</span>=<span class="val">2lss0RH7C4mCHlbFOJBnGHKpULmDsQ==.eyJhbGdvcml0aG0iOiJITUFDU0hBMjU2Iiw...</span>

<span class="comment">// From this point the flow is identical to the admin pre-authorized path</span></pre>
            </div>
          </div>

          <div class="callout">
            <span class="callout-icon">✅</span>
            <div class="callout-body">
              <strong>Approval is now stored</strong>
              Salesforce stores the user's approval for this connected app. Next time this user opens the canvas app, Salesforce finds the prior valid approval and POSTs the signed request directly — no OAuth flow, no consent screen.
            </div>
          </div>
        `
    },
    {
      title: 'Verify the Signature',
      actor: 'Canvas App',
      actorLabel: 'Canvas App',
      actorClass: 'actor-client',
      content: () => `
          <div class="step-header">
            <span class="actor-badge actor-client">Canvas App</span>
            <h2>Step 9 — Verify the HMAC Signature</h2>
            <p>The canvas app receives the POST with <code>signed_request</code>. Before trusting the payload, verify the HMAC-SHA256 signature using the Consumer Secret.</p>
          </div>

          <div class="section">
            <div class="section-title">Verification</div>
            <div class="data-card">
              <div class="data-card-header">Server-side — Python
                <span class="direction-badge dir-generate">Runs on your server</span>
              </div>
              <pre>import hmac, hashlib, base64

received_sig, encoded_context = signed_request.split('.', 1)

expected_sig = base64.b64encode(
    hmac.new(consumer_secret.encode(), encoded_context.encode(), hashlib.sha256).digest()
).decode()

if not hmac.compare_digest(received_sig, expected_sig):
    return 403  <span class="comment"># REJECT</span></pre>
            </div>
          </div>
        `
    },
    {
      title: 'Decode & Extract Token',
      actor: 'Canvas App',
      actorLabel: 'Canvas App',
      actorClass: 'actor-client',
      content: () => `
          <div class="step-header">
            <span class="actor-badge actor-client">Canvas App</span>
            <h2>Step 10 — Decode Context and Extract the Token</h2>
            <p>Signature verified. Base64-decode the context to get the JSON. The access token is at <code>client.oauthToken</code>.</p>
          </div>

          <div class="section">
            <div class="section-title">Decode and extract</div>
            <div class="data-card">
              <div class="data-card-header">Extract token and instance URL</div>
              <pre>import base64, json

context = json.loads(base64.b64decode(encoded_context + '=='))

<span class="key">access_token</span>  = context[<span class="val">'client'</span>][<span class="val">'oauthToken'</span>]
<span class="key">instance_url</span>  = context[<span class="val">'client'</span>][<span class="val">'targetOrigin'</span>]
<span class="key">username</span>      = context[<span class="val">'context'</span>][<span class="val">'user'</span>][<span class="val">'userName'</span>]
<span class="key">org_id</span>        = context[<span class="val">'context'</span>][<span class="val">'organization'</span>][<span class="val">'organizationId'</span>]</pre>
            </div>
          </div>
        `
    },
    {
      title: 'Call Salesforce API',
      actor: 'Canvas App',
      actorLabel: 'Canvas App',
      actorClass: 'actor-client',
      content: () => `
          <div class="step-header">
            <span class="actor-badge actor-client">Canvas App</span>
            <h2>Step 11 — Call the Salesforce API</h2>
            <p>Use <code>client.oauthToken</code> as the Bearer token. Use <code>client.targetOrigin</code> as the host. Identical to the admin pre-authorized path from this point.</p>
          </div>

          <div class="section">
            <div class="section-title">API request</div>
            <div class="data-card">
              <div class="data-card-header">GET https://myinstance.salesforce.com/services/data/v60.0/sobjects/Account
                <span class="direction-badge dir-send">Sent by canvas app</span>
              </div>
              <pre>GET /services/data/v60.0/sobjects/Account HTTP/1.1
Host: myinstance.salesforce.com
Authorization: Bearer <span class="val">00Dax0000000001EAA!ARQAQKGnqC3vVf7Q8xmLg...</span></pre>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Full self-authorization flow summary</div>
            <div class="explanation-box">
              <ul>
                <li><span class="hl-green">User opens page</span> — no prior approval found</li>
                <li><span class="hl-yellow">Salesforce loads canvas app in iframe</span> with <code>_sfdc_canvas_authvalue=user_approval_required</code></li>
                <li><span class="highlight">Canvas app calls <code>oauth.login()</code></span> — redirects browser to Salesforce Authorization endpoint</li>
                <li><span class="hl-yellow">User sees consent page</span>, clicks Allow — approval stored</li>
                <li><span class="hl-green">Salesforce returns tokens</span> via redirect URI → browser GETs Callback URL</li>
                <li><span class="highlight">Canvas app calls <code>repost()</code></span> → postMessage → PUT to Signed Request endpoint</li>
                <li><span class="hl-yellow">Salesforce generates signed request</span>, refreshes iframe, POSTs to canvas app URL</li>
                <li><span class="hl-green">Canvas app verifies</span> HMAC, decodes context, calls API</li>
                <li><span class="hl-green">Next session</span> — prior approval exists → Salesforce POSTs signed request directly</li>
              </ul>
            </div>
          </div>
        `
    }
  ]
};
