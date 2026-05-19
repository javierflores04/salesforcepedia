window.flows.samlbearer = {
  title: 'SAML Bearer Assertion Flow',
  steps: [
    {
      title: 'Overview',
      actor: 'intro',
      actorLabel: 'Introduction',
      actorClass: 'actor-client',
      content: () => `
          <div class="step-header">
            <span class="actor-badge actor-client">Introduction</span>
            <h2>SAML Bearer Assertion Flow</h2>
            <p>Defined in RFC 7522, this flow lets a server app obtain an OAuth access token by presenting a <strong>signed SAML 2.0 XML assertion</strong> as its credential — no client secret, no interactive login. The auth server verifies the XML signature and issues a token.</p>
          </div>

          ${buildActorsLegend('samlbearer')}

          <div class="section">
            <div class="section-title">Salesforce prerequisites — required before this flow runs</div>
            <div class="explanation-box">
              <ul>
                <li><span class="highlight">Connected App</span> — must be configured with <strong>Use Digital Signatures</strong> enabled and the public certificate uploaded.</li>
                <li><span class="hl-yellow">Prior user authorization</span> — allowed scopes come from <strong>approval previously provided by the user through another OAuth flow</strong> (e.g. Auth Code + PKCE). This flow does not collect consent itself.</li>
              </ul>
            </div>
            <div class="callout">
              <span class="callout-icon">⚠️</span>
              <div class="callout-body">
                <strong>Not fully "userless" in Salesforce</strong>
                Like JWT Bearer, this flow still acts <em>on behalf of a user</em> — the <code>&lt;NameID&gt;</code> element identifies the user whose pre-granted scopes are being used. The user just doesn't need to be present at runtime.
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">How it compares to JWT Bearer</div>
            <div class="explanation-box">
              Both flows are server-to-server assertion grants using asymmetric cryptography. The key difference is the <strong>assertion format</strong>:
              <ul>
                <li><span class="hl-green">JWT Bearer (RFC 7523)</span> — assertion is a compact, three-part JSON Web Token (<code>header.payload.signature</code>). Widely supported across modern identity providers.</li>
                <li><span class="highlight">SAML Bearer (RFC 7522)</span> — assertion is a verbose <strong>SAML 2.0 XML document</strong>, base64url-encoded. Common in enterprises already running SAML-based SSO infrastructure.</li>
              </ul>
              <br>
              Both use the same Salesforce token endpoint and return the same response. The choice usually depends on what your identity infrastructure already produces.
            </div>
            <div class="callout">
              <span class="callout-icon">🏢</span>
              <div class="callout-body">
                <strong>When to choose SAML Bearer over JWT Bearer</strong>
                Choose SAML Bearer when your enterprise already has a SAML Identity Provider (Okta, AD FS, PingIdentity) that can issue SAML assertions. JWT Bearer is simpler if you're building from scratch.
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Real-world uses</div>
            <div class="explanation-box">
              <ul>
                <li><span class="hl-green">Enterprise SSO integration</span> — orgs with an existing SAML IdP can extend it to grant API access without building a new JWT signing service</li>
                <li><span class="hl-green">Salesforce Canvas apps</span> — Canvas apps receive a signed SAML assertion from Salesforce that can be exchanged for an access token</li>
                <li><span class="hl-green">Legacy system integration</span> — older middleware already capable of producing SAML assertions can use this flow to call modern REST APIs</li>
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
            <h2>Step 1 — Generate Key Pair & Configure Connected App</h2>
            <p>One-time setup: generate an X.509 certificate key pair. Upload the <strong>public certificate</strong> to the Salesforce Connected App. Keep the private key on your server only. This is identical to the JWT Bearer setup.</p>
          </div>

          <div class="section">
            <div class="section-title">Generate the key pair (one-time setup)</div>
            <div class="data-card">
              <div class="data-card-header">Key generation — done once, stored securely
                <span class="direction-badge dir-generate">Generated locally</span>
              </div>
              <pre><span class="comment">// Generate RSA-256 key pair (2048-bit minimum, 4096-bit recommended)</span>
openssl genrsa -out private_key.pem 2048
openssl req -new -x509 -key private_key.pem -out certificate.crt -days 365

<span class="comment">// certificate.crt  → upload to Salesforce Connected App (Use Digital Signatures)</span>
<span class="comment">// private_key.pem  → stays on your server ONLY, never shared</span></pre>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Salesforce Connected App setup</div>
            <div class="data-card">
              <div class="data-card-header">Salesforce — Connected App configuration</div>
              <pre><span class="comment">// In Setup → App Manager → New Connected App:</span>
<span class="key">Enable OAuth Settings</span>:       <span class="val">✓</span>
<span class="key">Use Digital Signatures</span>:      <span class="val">✓  (upload certificate.crt here)</span>
<span class="key">Selected OAuth Scopes</span>:       <span class="val">api, refresh_token (or as needed)</span>
<span class="key">Permitted Users</span>:             <span class="val">Admin approved users are pre-authorized</span>

<span class="comment">// Also required: pre-authorize the user whose identity will be used</span>
<span class="comment">// (via Auth Code flow or policy approval) — scopes come from that prior grant</span></pre>
            </div>
          </div>

          <div class="callout">
            <span class="callout-icon">🗝️</span>
            <div class="callout-body">
              <strong>Store the private key in a secrets manager</strong>
              AWS KMS, GCP Cloud KMS, HashiCorp Vault, or an HSM can hold and use the private key without it ever being readable in plaintext. Never commit it to source control.
            </div>
          </div>
        `
    },
    {
      title: 'Build SAML Assertion',
      actor: 'Client Service',
      actorLabel: 'Client Service',
      actorClass: 'actor-client',
      content: () => `
          <div class="step-header">
            <span class="actor-badge actor-client">Client Service</span>
            <h2>Step 2 — Build and Sign the SAML Assertion</h2>
            <p>When the service needs an access token, it constructs a SAML 2.0 XML document with specific elements that identify the request, then signs the XML with its private key. This signed XML is the assertion — the proof of identity.</p>
          </div>

          <div class="section">
            <div class="section-title">SAML Assertion XML structure</div>
            <div class="data-card">
              <div class="data-card-header">SAML 2.0 Assertion — required elements
                <span class="direction-badge dir-generate">Built locally</span>
              </div>
              <pre><span class="comment">&lt;!-- Salesforce requires SAML 2.0 assertions --&gt;</span>
&lt;<span class="key">saml:Assertion</span>
  xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion"
  <span class="key">ID</span>="<span class="val">_a8f3c1d94e724b0a88f21c6d9e0b3f5a</span>"  <span class="comment">&lt;!-- unique per assertion --&gt;</span>
  <span class="key">Version</span>="<span class="val">2.0</span>"
  <span class="key">IssueInstant</span>="<span class="val">2026-04-25T10:00:00Z</span>"&gt;

  &lt;<span class="key">saml:Issuer</span>&gt;<span class="val">3MVG9_e4Xi_jbp1OtHHf_LvkL2pqYwxMzFzHmKH8Qx2R</span>&lt;/saml:Issuer&gt;
  <span class="comment">&lt;!-- Issuer = Connected App Consumer Key (your client_id) --&gt;</span>

  &lt;<span class="key">saml:Subject</span>&gt;
    &lt;<span class="key">saml:NameID</span>
      Format="urn:oasis:names:tc:SAML:1.1:nameid-format:unspecified"&gt;
      <span class="val">user@example.com</span>
    &lt;/saml:NameID&gt;
    <span class="comment">&lt;!-- NameID = the Salesforce USERNAME of the pre-authorized user --&gt;</span>
    &lt;<span class="key">saml:SubjectConfirmation</span>
      Method="urn:oasis:names:tc:SAML:2.0:cm:bearer"&gt;
      &lt;saml:SubjectConfirmationData
        <span class="key">NotOnOrAfter</span>="<span class="val">2026-04-25T10:05:00Z</span>"
        <span class="key">Recipient</span>="<span class="val">https://login.salesforce.com/services/oauth2/token</span>"/&gt;
      <span class="comment">&lt;!-- NotOnOrAfter: MUST be short, max 5 minutes from IssueInstant --&gt;</span>
    &lt;/saml:SubjectConfirmation&gt;
  &lt;/saml:Subject&gt;

  &lt;<span class="key">saml:Conditions</span>
    <span class="key">NotBefore</span>="<span class="val">2026-04-25T09:59:00Z</span>"
    <span class="key">NotOnOrAfter</span>="<span class="val">2026-04-25T10:05:00Z</span>"&gt;
    &lt;<span class="key">saml:AudienceRestriction</span>&gt;
      &lt;saml:Audience&gt;<span class="val">https://login.salesforce.com</span>&lt;/saml:Audience&gt;
      <span class="comment">&lt;!-- Audience = Salesforce login URL (NOT the token endpoint) --&gt;</span>
      <span class="comment">&lt;!-- Use test.salesforce.com for sandboxes --&gt;</span>
    &lt;/saml:AudienceRestriction&gt;
  &lt;/saml:Conditions&gt;

  &lt;<span class="key">saml:AuthnStatement</span>
    AuthnInstant="<span class="val">2026-04-25T10:00:00Z</span>"&gt;
    &lt;saml:AuthnContext&gt;
      &lt;saml:AuthnContextClassRef&gt;
        urn:oasis:names:tc:SAML:2.0:ac:classes:unspecified
      &lt;/saml:AuthnContextClassRef&gt;
    &lt;/saml:AuthnContext&gt;
  &lt;/saml:AuthnStatement&gt;

  <span class="comment">&lt;!-- XML Signature appended here by signing library --&gt;</span>
  &lt;<span class="key">ds:Signature</span> xmlns:ds="http://www.w3.org/2000/09/xmldsig#"&gt;...&lt;/ds:Signature&gt;

&lt;/saml:Assertion&gt;</pre>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Encoding the assertion for the POST</div>
            <div class="data-card">
              <div class="data-card-header">Base64url-encode the signed XML</div>
              <pre><span class="comment">// After signing the XML with your private key, base64url-encode the entire document</span>
<span class="comment">// (no padding — same encoding used in JWTs)</span>

<span class="key">assertion</span> = base64url(signedXml)

<span class="comment">// Example result (truncated):</span>
<span class="val">PHNhbWw6QXNzZXJ0aW9uIHhtbG5zOnNhbWw9InVybjpvYXNpczpuYW1lczp0YzpT</span>
<span class="val">QU1MOjIuMDphc3NlcnRpb24iIElEPSJfYThmM2MxZDk0ZTcyNGIwYTg4ZjIxYzZk</span>
<span class="val">OWUwYjNmNWEiIFZlcnNpb249IjIuMCIgSXNzdWVJbnN0YW50PSIyMDI2LTA0LTI1</span>
<span class="val">VDEwOjAwOjAwWiI+...</span></pre>
            </div>
          </div>

          <div class="callout">
            <span class="callout-icon">📦</span>
            <div class="callout-body">
              <strong>Use an XML signing library — don't hand-roll XML signatures</strong>
              XML Digital Signatures (XMLDSig) are notoriously complex. Use a well-maintained library: <code>xmlsec</code> (Python), <code>xml-crypto</code> (Node.js), <code>Spring Security SAML</code> (Java), or your SAML IdP's assertion builder.
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
            <h2>Step 3 — POST the SAML Assertion to the Token Endpoint</h2>
            <p>The base64url-encoded signed XML is sent as the <code>assertion</code> parameter. The <code>grant_type</code> is the SAML-specific URN defined in RFC 7522.</p>
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

<span class="key">grant_type</span>  = <span class="val">urn:ietf:params:oauth:grant-type:saml2-bearer</span>
<span class="comment">              // ⚠️ Different URN from JWT Bearer (jwt-bearer vs saml2-bearer)</span>

<span class="key">assertion</span>   = <span class="val">PHNhbWw6QXNzZXJ0aW9uIHhtbG5zOnNhbWw9InVybjpvYXNpczpuYW1lczp0YzpT</span>
              <span class="val">QU1MOjIuMDphc3NlcnRpb24iIElEPSJfYThmM2MxZDk0ZTcyNGIwYTg4ZjIxYzZk</span>
              <span class="val">OWUwYjNmNWEiIFZlcnNpb249IjIuMCIgSXNzdWVJbnN0YW50PSIyMDI2...</span>
<span class="comment">              // Base64url-encoded signed SAML XML assertion</span>

<span class="comment">// Note: NO client_id in the body — it's the &lt;saml:Issuer&gt; inside the XML</span>
<span class="comment">// Note: NO scope parameter — scopes come from the user's prior authorization</span>
<span class="comment">// Use test.salesforce.com instead of login.salesforce.com for sandboxes</span></pre>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Comparison: SAML Bearer vs JWT Bearer POST</div>
            <div class="explanation-box">
              <ul>
                <li><span class="highlight">SAML Bearer</span>: <code>grant_type=urn:ietf:params:oauth:grant-type:saml2-bearer</code> + <code>assertion=&lt;base64url XML&gt;</code>. Identity encoded in SAML XML elements.</li>
                <li><span class="hl-green">JWT Bearer</span>: <code>grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer</code> + <code>assertion=&lt;JWT&gt;</code>. Identity encoded in compact JSON claims.</li>
              </ul>
              <br>
              The token endpoint, response format, and Salesforce behavior are identical — only the assertion format differs.
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
            <h2>Step 4 — Auth Server Validates the SAML Assertion</h2>
            <p>Salesforce parses the XML, extracts the <code>&lt;Issuer&gt;</code> to look up the Connected App, then verifies the XML signature against the registered public certificate. If any check fails, the request is rejected.</p>
          </div>

          <div class="section">
            <div class="section-title">Validation steps (in order)</div>
            <div class="explanation-box">
              <ul>
                <li><span class="hl-green">1. Decode the assertion</span> — base64url-decode the parameter to recover the signed XML</li>
                <li><span class="hl-green">2. Look up client</span> — read <code>&lt;saml:Issuer&gt;</code> from the XML, find the Connected App by Consumer Key</li>
                <li><span class="hl-green">3. Retrieve public certificate</span> — get the certificate uploaded to the Connected App's "Use Digital Signatures" setting</li>
                <li><span class="hl-green">4. Verify the XML signature</span> — cryptographically verify the <code>&lt;ds:Signature&gt;</code> element against the registered certificate's public key</li>
                <li><span class="hl-yellow">5. Check Audience</span> — <code>&lt;saml:Audience&gt;</code> must equal <code>https://login.salesforce.com</code>. Rejects assertions intended for other services.</li>
                <li><span class="hl-yellow">6. Check NotOnOrAfter</span> — assertion must not be expired (max 5 minutes from IssueInstant)</li>
                <li><span class="hl-yellow">7. Check NotBefore</span> — IssueInstant must not be in the future (clock skew check)</li>
                <li><span class="highlight">8. Check NameID user</span> — the username in <code>&lt;saml:NameID&gt;</code> must be a valid Salesforce user who has previously authorized the Connected App</li>
                <li><span class="highlight">9. Check scopes</span> — scopes are taken from the user's prior authorization grant</li>
              </ul>
            </div>
          </div>

          <div class="section">
            <div class="section-title">What Salesforce checks in the Connected App</div>
            <div class="data-card">
              <div class="data-card-header">Salesforce Connected App — internal record</div>
              <pre>{
  <span class="key">"consumerKey"</span>:     <span class="val">"3MVG9_e4Xi_jbp1OtHHf_LvkL2pqYwxMzFzHmKH8Qx2R"</span>,
  <span class="comment">                   // Matched against &lt;saml:Issuer&gt; in the assertion</span>

  <span class="key">"certificate"</span>:     <span class="val">"-----BEGIN CERTIFICATE-----\nMIID..."</span>,
  <span class="comment">                   // Public certificate used to verify XML signature</span>

  <span class="key">"permittedUsers"</span>:  <span class="val">"Admin approved users are pre-authorized"</span>,
  <span class="comment">                   // user@example.com must appear in pre-authorized users</span>

  <span class="key">"allowedScopes"</span>:   <span class="val">"api refresh_token"</span>
  <span class="comment">                   // Scopes from the user's prior OAuth authorization</span>
}</pre>
            </div>
          </div>

          <div class="callout">
            <span class="callout-icon">🔏</span>
            <div class="callout-body">
              <strong>XML signature verification is the core security guarantee</strong>
              Only the holder of the private key can produce a valid XML signature. If verification passes, Salesforce knows with cryptographic certainty the assertion was produced by the registered client — not intercepted or forged.
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
            <p>Validation passed. Salesforce issues an access token. The response format is identical to JWT Bearer — including the Salesforce-specific fields.</p>
          </div>

          <div class="section">
            <div class="section-title">Token response</div>
            <div class="data-card">
              <div class="data-card-header">200 OK — application/json
                <span class="direction-badge dir-receive">Received by service</span>
              </div>
              <pre>{
  <span class="key">"access_token"</span>: <span class="val">"00Dax0000000001EAA!ARQAQKGnqC3vVf7Q8xmLg..."</span>,
  <span class="key">"token_type"</span>:   <span class="val">"Bearer"</span>,
  <span class="key">"instance_url"</span>: <span class="val">"https://myinstance.salesforce.com"</span>,
  <span class="comment">                // ⚠️ Use this URL for ALL subsequent API calls — not a hardcoded domain</span>
  <span class="key">"id"</span>:           <span class="val">"https://login.salesforce.com/id/00Dax0000000001EAA/005x0000000xxxxAAA"</span>,
  <span class="key">"issued_at"</span>:    <span class="val">"1745596400579"</span>
  <span class="comment">// No refresh_token — just re-assert when the access token expires</span>
  <span class="comment">// No expires_in in Salesforce — access tokens expire after 1–2 hours by default</span>
}</pre>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Salesforce-specific response fields</div>
            <div class="explanation-box">
              <ul>
                <li><span class="highlight">instance_url</span> — the org-specific URL for your Salesforce instance. Always use this as the host for REST API calls. Never hardcode a Salesforce domain.</li>
                <li><span class="hl-yellow">id</span> — identity URL that returns information about the user and org. Contains the org ID and user ID in the path.</li>
                <li><span class="hl-green">issued_at</span> — Unix timestamp (milliseconds) when the token was issued. Useful for calculating expiry.</li>
              </ul>
            </div>
            <div class="callout">
              <span class="callout-icon">♻️</span>
              <div class="callout-body">
                <strong>No refresh_token — this is by design</strong>
                Since the client can build and sign a new SAML assertion at any time, a refresh token would add no value. When the access token expires, build a new assertion (new <code>ID</code> attribute, new <code>IssueInstant</code>, new <code>NotOnOrAfter</code>) and POST it again.
              </div>
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
            <p>The access token is used exactly the same way as in any other OAuth flow — as a Bearer token in the Authorization header. Use the <code>instance_url</code> from the token response as the host.</p>
          </div>

          <div class="section">
            <div class="section-title">API request</div>
            <div class="data-card">
              <div class="data-card-header">GET https://myinstance.salesforce.com/services/data/v60.0/sobjects/Account
                <span class="direction-badge dir-send">Sent by service</span>
              </div>
              <pre>GET /services/data/v60.0/sobjects/Account HTTP/1.1
Host: myinstance.salesforce.com
Authorization: Bearer <span class="val">00Dax0000000001EAA!ARQAQKGnqC3vVf7Q8xmLg...</span></pre>
            </div>
          </div>

          <div class="section">
            <div class="section-title">API response</div>
            <div class="data-card">
              <div class="data-card-header">200 OK
                <span class="direction-badge dir-receive">Received by service</span>
              </div>
              <pre>{
  <span class="key">"objectDescribe"</span>: {
    <span class="key">"name"</span>:     <span class="val">"Account"</span>,
    <span class="key">"label"</span>:    <span class="val">"Account"</span>,
    <span class="key">"keyPrefix"</span>: <span class="val">"001"</span>
  },
  <span class="key">"recentItems"</span>: [...]
}</pre>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Full flow summary — what traveled the network</div>
            <div class="explanation-box">
              <ul>
                <li><span class="hl-green">Sent to auth server:</span> the signed SAML XML assertion (short-lived, one-time use)</li>
                <li><span class="hl-yellow">Received from auth server:</span> access token + instance_url</li>
                <li><span class="hl-green">Sent to API:</span> access token as Bearer header (using instance_url as host)</li>
                <li><span class="highlight">Never sent anywhere:</span> the private key</li>
              </ul>
              <br>
              The private key is only used locally to sign the XML. Salesforce only ever sees the signature output — not the key itself.
            </div>
          </div>

          <div class="callout">
            <span class="callout-icon">♻️</span>
            <div class="callout-body">
              <strong>Re-asserting when the access token expires</strong>
              Build a new SAML assertion with a new unique <code>ID</code> attribute, updated <code>IssueInstant</code>, and a new <code>NotOnOrAfter</code> (max 5 minutes ahead). Sign and POST again. Cache the access token and reuse it until close to expiry — don't assert on every API call.
            </div>
          </div>
        `
    }
  ]
};
