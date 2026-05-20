window.flows.canvas = {
  title: 'Canvas: Admin Pre-authorized',
  steps: [
    {
      title: 'Overview',
      actor: 'intro',
      actorLabel: 'Introduction',
      actorClass: 'actor-client',
      content: () => `
          <div class="step-header">
            <span class="actor-badge actor-client">Introduction</span>
            <h2>Canvas App — Admin Pre-authorized</h2>
            <p>The signed request flow is offered as an alternative to the canvas app initiating a standard OAuth flow. When <strong>Permitted Users</strong> is set to <em>"Admin approved users are pre-authorized"</em>, Salesforce does not run any OAuth flow — it checks if the user is on the pre-authorized list and POSTs the signed request directly.</p>
          </div>

          ${buildActorsLegend('canvas')}

          <div class="section">
            <div class="section-title">Permitted Users — two settings, two behaviors</div>
            <div class="explanation-box">
              The connected app's <strong>Permitted Users</strong> setting controls what Salesforce does when a user opens the canvas app:
              <ul>
                <li><span class="highlight">Admin approved users are pre-authorized</span> — admin pre-authorizes specific users via profile or permission set assignment. Salesforce checks the list:
                  <ul style="margin-top:6px">
                    <li>User IS pre-authorized → Salesforce POSTs the signed request directly. No consent screen.</li>
                    <li>User is NOT pre-authorized → Salesforce shows a <strong>"No Access"</strong> error. Flow stops.</li>
                  </ul>
                </li>
                <li><span class="hl-green">All users may self-authorize</span> — users can authorize themselves. If no prior approval exists, Salesforce initiates an OAuth flow through the canvas app. See the <em>Self-Authorization</em> tab for that path.</li>
              </ul>
            </div>
            <div class="callout">
              <span class="callout-icon">⚡</span>
              <div class="callout-body">
                <strong>No OAuth flow in this path</strong>
                When the user is admin pre-authorized, Salesforce generates the signed request and POSTs it directly — skipping any consent screen, redirect, or access token exchange.
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Signed request format</div>
            <div class="explanation-box">
              The signed request is appended as a parameter in a POST request to the canvas app URL. It consists of two parts separated by a period:
              <div class="data-card" style="margin-top:12px">
                <div class="data-card-header">signed_request parameter</div>
                <pre><span class="key">signed_request</span> = <span class="val">HMAC_SIGNATURE</span>.<span class="val">BASE64_CONTEXT</span>

<span class="comment">// HMAC_SIGNATURE = base64(HMAC-SHA256(consumerSecret, BASE64_CONTEXT))</span>
<span class="comment">// BASE64_CONTEXT = base64(JSON context payload containing oauthToken)</span></pre>
              </div>
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
            <p>One-time setup. Enable Canvas, set Access Method to <strong>Signed Request (POST)</strong>, and set Permitted Users to <strong>Admin approved users are pre-authorized</strong>.</p>
          </div>

          <div class="section">
            <div class="section-title">Connected app configuration</div>
            <div class="data-card">
              <div class="data-card-header">Setup → App Manager → New Connected App</div>
              <pre><span class="comment">// OAuth Settings:</span>
<span class="key">Enable OAuth Settings</span>:    <span class="val">✓</span>
<span class="key">Selected OAuth Scopes</span>:    <span class="val">api, refresh_token (or as needed)</span>

<span class="comment">// Canvas:</span>
<span class="key">Enable Canvas</span>:            <span class="val">✓</span>
<span class="key">Canvas App URL</span>:          <span class="val">https://canvas.example.com/app</span>
<span class="comment">                          // ⚠️ Must be HTTPS</span>
<span class="key">Access Method</span>:           <span class="val">Signed Request (POST)</span>
<span class="key">Locations</span>:               <span class="val">App Launcher, Chatter Tab, Visualforce Page...</span>

<span class="comment">// Policies → Permitted Users:</span>
<span class="key">Permitted Users</span>:          <span class="val">Admin approved users are pre-authorized</span>
<span class="comment">                          // Users not assigned via profile/permission set → No Access</span></pre>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Pre-authorize users — admin step</div>
            <div class="data-card">
              <div class="data-card-header">Assign access via profile or permission set</div>
              <pre><span class="comment">// Option A: assign via profile</span>
Setup → Profiles → [Profile Name] → Connected App Access → MyCanvasApp → Enabled

<span class="comment">// Option B: assign via permission set</span>
Setup → Permission Sets → [Set Name] → Connected App Access → MyCanvasApp → Enabled

<span class="comment">// Only users with this assignment will pass the pre-authorization check</span>
<span class="comment">// All others receive a "No Access" error when opening the canvas app</span></pre>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Consumer Secret — your signing key</div>
            <div class="data-card">
              <div class="data-card-header">Connected App → Manage Consumer Details</div>
              <pre><span class="key">Consumer Key</span>:    <span class="val">3MVG9_e4Xi_jbp1OtHHf_LvkL2pqYwxMzFzHmKH8Qx2R</span>
<span class="key">Consumer Secret</span>: <span class="val">9F3C2D1A8E7B4062...</span>
<span class="comment">                 // Store server-side only — used to verify the HMAC signature</span></pre>
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
            <p>The user is already logged into Salesforce and navigates to a page that contains the canvas app — via the App Launcher, a Chatter tab, a Visualforce page, or a Lightning component. The browser sends a page request to Salesforce.</p>
          </div>

          <div class="section">
            <div class="section-title">Where canvas apps can be embedded</div>
            <div class="explanation-box">
              <ul>
                <li><span class="hl-green">App Launcher</span> — tile in the Salesforce App Launcher grid</li>
                <li><span class="hl-green">Chatter Tab / Feed</span> — embedded as a tab or inside a Chatter post</li>
                <li><span class="hl-green">Visualforce Page</span> — via <code>&lt;apex:canvasApp&gt;</code> component</li>
                <li><span class="hl-green">Lightning Component</span> — via <code>forceCanvas:app</code> component</li>
                <li><span class="highlight">Mobile Cards</span> — shown as a card in the Salesforce mobile app</li>
              </ul>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Browser page request</div>
            <div class="data-card">
              <div class="data-card-header">Browser → Salesforce</div>
              <pre>GET /apex/MyPageWithCanvas HTTP/1.1
Host: myinstance.salesforce.com
<span class="comment">// Salesforce receives the request, identifies the canvas app on the page,</span>
<span class="comment">// and evaluates the user's authorization before rendering</span></pre>
            </div>
          </div>
        `
    },
    {
      title: 'Salesforce Evaluates Authorization',
      actor: 'Salesforce',
      actorLabel: 'Salesforce',
      actorClass: 'actor-authserver',
      content: () => `
          <div class="step-header">
            <span class="actor-badge actor-authserver">Salesforce</span>
            <h2>Step 3 — Salesforce Evaluates User Authorization</h2>
            <p>Salesforce checks the connected app's <strong>Permitted Users</strong> setting. In this path it is set to <em>"Admin approved users are pre-authorized"</em>, so Salesforce checks if the user has been assigned access by an admin.</p>
          </div>

          <div class="section">
            <div class="section-title">Decision logic</div>
            <div class="explanation-box">
              <ol>
                <li>Read connected app's <strong>Permitted Users</strong> setting → <em>"Admin approved users are pre-authorized"</em></li>
                <li>Check if this user's profile or permission set grants access to this connected app</li>
                <li>
                  <span class="hl-yellow">User is NOT pre-authorized</span> → Salesforce shows a <strong>"No Access"</strong> error page. No signed request is generated. Flow ends.<br><br>
                  <span class="hl-green">User IS pre-authorized</span> → proceed directly to generating and POSTing the signed request.
                </li>
              </ol>
            </div>
            <div class="callout">
              <span class="callout-icon">🚫</span>
              <div class="callout-body">
                <strong>"No Access" — what the user sees</strong>
                If the user's profile or permission set doesn't include this connected app, Salesforce displays an error page and the canvas app never loads. The canvas app server receives no POST.
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Pre-authorized → Salesforce generates signed request</div>
            <div class="explanation-box">
              Salesforce gathers the user context, generates an access token for the user, builds the context JSON, signs it with HMAC-SHA256 using the Consumer Secret, and proceeds to POST the signed request.
            </div>
          </div>
        `
    },
    {
      title: 'Salesforce POSTs Signed Request',
      actor: 'Salesforce',
      actorLabel: 'Salesforce',
      actorClass: 'actor-authserver',
      content: () => `
          <div class="step-header">
            <span class="actor-badge actor-authserver">Salesforce</span>
            <h2>Step 4 — Salesforce POSTs the Signed Request</h2>
            <p>Salesforce builds and signs the context payload, then POSTs it as <code>signed_request</code> to the canvas app URL. The canvas app is loaded inside an iframe in the Salesforce page and receives this POST.</p>
          </div>

          <div class="section">
            <div class="section-title">How Salesforce builds the signed_request</div>
            <div class="data-card">
              <div class="data-card-header">Constructed server-side by Salesforce</div>
              <pre><span class="comment">// 1. Build the context JSON</span>
context = {
  <span class="key">"algorithm"</span>:  <span class="val">"HMACSHA256"</span>,
  <span class="key">"issuedAt"</span>:   <span class="val">1745596400</span>,
  <span class="key">"userId"</span>:     <span class="val">"005x0000000xxxxAAA"</span>,
  <span class="key">"client"</span>: {
    <span class="key">"oauthToken"</span>:   <span class="val">"00Dax0000000001EAA!ARQAQKGnq..."</span>,
    <span class="key">"targetOrigin"</span>: <span class="val">"https://myinstance.salesforce.com"</span>,
    <span class="key">"instanceId"</span>:   <span class="val">"_:default"</span>
  },
  <span class="key">"context"</span>: {
    <span class="key">"user"</span>:         { <span class="comment">/* userId, userName, email, locale... */</span> },
    <span class="key">"organization"</span>: { <span class="comment">/* organizationId, name */</span> },
    <span class="key">"links"</span>:        { <span class="comment">/* restUrl, sobjectUrl, queryUrl... */</span> },
    <span class="key">"application"</span>:  { <span class="comment">/* name, canvasUrl, authType: "SIGNED_REQUEST" */</span> }
  }
}

<span class="comment">// 2. Base64-encode the JSON</span>
encodedContext = base64(JSON.stringify(context))

<span class="comment">// 3. Sign with HMAC-SHA256 using the Consumer Secret</span>
signature = base64(HMAC-SHA256(consumerSecret, encodedContext))

<span class="comment">// 4. Assemble</span>
signed_request = signature + <span class="val">"."</span> + encodedContext</pre>
            </div>
          </div>

          <div class="section">
            <div class="section-title">The POST to the canvas app</div>
            <div class="data-card">
              <div class="data-card-header">POST https://canvas.example.com/app
                <span class="direction-badge dir-send">Sent by Salesforce</span>
              </div>
              <pre>POST /app HTTP/1.1
Host: canvas.example.com
Content-Type: application/x-www-form-urlencoded

<span class="key">signed_request</span>=<span class="val">2lss0RH7C4mCHlbFOJBnGHKpULmDsQ==.eyJhbGdvcml0aG0iOiJITUFDU0hBMjU2Iiw...</span></pre>
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
            <h2>Step 5 — Verify the HMAC Signature</h2>
            <p>Before trusting any of the payload — especially the access token — <strong>always verify the signature</strong>. Split on the first period, recompute the HMAC using the Consumer Secret, compare in constant time.</p>
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
    return 403  <span class="comment"># REJECT — signature invalid</span></pre>
            </div>
          </div>

          <div class="callout">
            <span class="callout-icon">⚠️</span>
            <div class="callout-body">
              <strong>Never skip this step</strong>
              Without verification an attacker can forge a signed_request with arbitrary user identity and POST it to your endpoint.
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
            <h2>Step 6 — Decode Context and Extract the Token</h2>
            <p>Signature verified. Base64-decode the context half to get the JSON. The access token is at <code>client.oauthToken</code>.</p>
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
<span class="key">org_id</span>        = context[<span class="val">'context'</span>][<span class="val">'organization'</span>][<span class="val">'organizationId'</span>]
<span class="key">rest_url</span>      = context[<span class="val">'context'</span>][<span class="val">'links'</span>][<span class="val">'restUrl'</span>]</pre>
            </div>
          </div>

          <div class="callout">
            <span class="callout-icon">💾</span>
            <div class="callout-body">
              <strong>Keep the token server-side</strong>
              Store the access token in a server-side session. Never forward the raw signed_request or Consumer Secret to the browser.
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
            <h2>Step 7 — Call the Salesforce API</h2>
            <p>Use <code>client.oauthToken</code> as the Bearer token. Use <code>client.targetOrigin</code> as the host.</p>
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
            <div class="section-title">Flow summary — admin pre-authorized path</div>
            <div class="explanation-box">
              <ul>
                <li><span class="hl-green">User opens page</span> — already logged into Salesforce</li>
                <li><span class="hl-yellow">Salesforce checks</span> — user is admin pre-authorized ✓</li>
                <li><span class="hl-yellow">Salesforce POSTs</span> signed_request — no OAuth flow, no redirect, no consent screen</li>
                <li><span class="highlight">Canvas app verifies</span> HMAC-SHA256 using Consumer Secret</li>
                <li><span class="hl-green">API calls</span> use <code>oauthToken</code> as Bearer, <code>targetOrigin</code> as host</li>
              </ul>
            </div>
          </div>
        `
    }
  ]
};
