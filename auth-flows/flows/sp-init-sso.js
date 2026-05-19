// SP-Initiated SSO: Salesforce as Service Provider
window.flows.spinitsso = {
  title: 'SP-Initiated SSO — Salesforce as SP',
  steps: [
    {
      title: 'Overview',
      actor: 'intro',
      actorLabel: 'Introduction',
      actorClass: 'actor-client',
      content: () => `
          <div class="step-header">
            <span class="actor-badge actor-client">Introduction</span>
            <h2>SP-Initiated SSO — Salesforce as Service Provider</h2>
            <p>In SP-Initiated SSO, the user starts at the <strong>Service Provider</strong> (Salesforce) — not the Identity Provider. Salesforce generates a <strong>SAML AuthnRequest</strong>, redirects the user to the IDP, the IDP authenticates and returns a <strong>SAML Response</strong>, and Salesforce validates it to log the user in.</p>
          </div>

          ${buildActorsLegend('spinitsso')}

          <div class="section">
            <div class="section-title">Roles in this flow</div>
            <div class="explanation-box">
              <ul>
                <li><span class="highlight">Service Provider (SP)</span> — Salesforce. Initiates the flow, consumes the SAML Response, creates the session.</li>
                <li><span class="hl-yellow">Identity Provider (IDP)</span> — your enterprise identity system (Okta, Microsoft Entra ID, AD FS, PingIdentity, etc.). Authenticates the user and issues the SAML Response.</li>
                <li><span class="hl-green">User / Browser</span> — the browser is the messenger between SP and IDP. All SAML messages travel via browser redirects or POST forms — not direct server-to-server calls.</li>
              </ul>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Salesforce prerequisites</div>
            <div class="explanation-box">
              <ul>
                <li><span class="highlight">My Domain required</span> — SP-Initiated SSO requires My Domain to be configured and deployed. It enables deep linking and the custom login URL that triggers the SAML flow.</li>
                <li><span class="hl-yellow">Single Sign-On Settings</span> — configured in Setup with values from the IDP: IDP's SSO URL, IDP certificate (for signature validation), Entity ID.</li>
                <li><span class="hl-green">IDP must know Salesforce's metadata</span> — the IDP needs the Salesforce <strong>ACS URL</strong> (where to POST the SAML Response) and the Salesforce <strong>Entity ID</strong>.</li>
              </ul>
            </div>
            <div class="callout">
              <span class="callout-icon">🔐</span>
              <div class="callout-body">
                <strong>SAML uses XML signatures — not OAuth tokens</strong>
                SAML is a separate standard from OAuth. The IDP signs an XML document (the SAML Response) with its private key. Salesforce verifies it using the IDP's public certificate. No access tokens are issued in this flow — a Salesforce session is created directly.
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">SAML binding options</div>
            <div class="explanation-box">
              The SAML AuthnRequest can be sent using two bindings:
              <ul>
                <li><span class="hl-green">HTTP Redirect binding</span> — the AuthnRequest is base64-encoded and appended as a URL parameter in a GET redirect. Deflate-compressed before encoding. Most common.</li>
                <li><span class="highlight">HTTP POST binding</span> — the AuthnRequest is sent as a form POST. The SAML Response from the IDP is always delivered via HTTP POST.</li>
              </ul>
            </div>
          </div>
        `
    },
    {
      title: 'Setup: SP & IDP Exchange Metadata',
      actor: 'intro',
      actorLabel: 'One-time Setup',
      actorClass: 'actor-client',
      content: () => `
          <div class="step-header">
            <span class="actor-badge actor-client">One-time Setup</span>
            <h2>Step 1 — Configure SP and IDP with Each Other's Metadata</h2>
            <p>Before any SSO flow can run, Salesforce (SP) and the IDP must exchange configuration metadata. Each side needs to know the other's URLs and certificates.</p>
          </div>

          <div class="section">
            <div class="section-title">Configure Salesforce (SP)</div>
            <div class="data-card">
              <div class="data-card-header">Setup → Single Sign-On Settings → New</div>
              <pre><span class="comment">// Values you get from your IDP:</span>
<span class="key">Name</span>:                        <span class="val">MyIDP</span>
<span class="key">Issuer</span>:                      <span class="val">https://idp.example.com/issuer</span>
<span class="comment">                             // IDP's Entity ID — must match exactly what IDP sends</span>
<span class="key">Identity Provider Login URL</span>: <span class="val">https://idp.example.com/sso/saml</span>
<span class="comment">                             // IDP's SSO endpoint — where Salesforce redirects the user</span>
<span class="key">Identity Provider Certificate</span>: <span class="val">[upload IDP's public certificate]</span>
<span class="comment">                             // Used to verify the IDP's signature on the SAML Response</span>
<span class="key">SAML Request Binding</span>:        <span class="val">HTTP Redirect</span>  <span class="comment">// or HTTP POST</span>
<span class="key">Request Signature Method</span>:    <span class="val">RSA-SHA256</span>
<span class="key">User Provisioning</span>:           <span class="val">JIT enabled (optional)</span>
<span class="comment">                             // Just-In-Time: auto-create/update user on first SSO login</span></pre>
            </div>
          </div>

          <div class="section">
            <div class="section-title">What Salesforce exposes to the IDP</div>
            <div class="data-card">
              <div class="data-card-header">Values the IDP must be configured with</div>
              <pre><span class="comment">// Found in Setup → Single Sign-On Settings → [your config]:</span>
<span class="key">ACS URL</span>:    <span class="val">https://mycompany.my.salesforce.com?so=&lt;OrgID&gt;</span>
<span class="comment">            // Authorization Consumer Service URL</span>
<span class="comment">            // This is where the IDP POSTs the SAML Response after authentication</span>
<span class="key">Entity ID</span>:  <span class="val">https://saml.salesforce.com</span>
<span class="comment">            // Salesforce's SAML Entity ID — identifies Salesforce to the IDP</span>
<span class="comment">            // Can be customized — must match what Salesforce sends in the AuthnRequest</span></pre>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Just-In-Time (JIT) provisioning</div>
            <div class="explanation-box">
              When JIT is enabled, Salesforce automatically creates or updates a user record on first SSO login based on attributes in the SAML assertion. No need to pre-create users manually.
              <ul>
                <li><span class="hl-green">Standard JIT</span> — Salesforce maps SAML attributes to User fields using the attribute mapping configured in SSO Settings.</li>
                <li><span class="highlight">Custom JIT</span> — implement <code>Auth.SamlJitHandler</code> Apex interface for custom provisioning logic (e.g., create related records, assign permission sets).</li>
              </ul>
            </div>
          </div>
        `
    },
    {
      title: 'User Accesses Salesforce',
      actor: 'User / Browser',
      actorLabel: 'User / Browser',
      actorClass: 'actor-user',
      content: () => `
          <div class="step-header">
            <span class="actor-badge actor-user">User / Browser</span>
            <h2>Step 2 — User Accesses Salesforce (the SP)</h2>
            <p>The user navigates to the Salesforce My Domain URL — either directly or via a deep link to a specific page. Salesforce detects that SSO is configured and that the user is not yet authenticated.</p>
          </div>

          <div class="section">
            <div class="section-title">Entry points</div>
            <div class="explanation-box">
              <ul>
                <li><span class="hl-green">Direct My Domain URL</span> — <code>https://mycompany.my.salesforce.com</code></li>
                <li><span class="hl-green">Deep link</span> — <code>https://mycompany.my.salesforce.com/001/o</code> (a specific record or page). My Domain preserves this as the <strong>RelayState</strong> so the user lands on the right page after SSO.</li>
                <li><span class="highlight">Bookmark / app launcher</span> — any URL under the My Domain</li>
              </ul>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Salesforce checks authentication</div>
            <div class="explanation-box">
              Salesforce checks if the user has an active session. No active session found → Salesforce determines SSO is configured → prepares a SAML AuthnRequest and redirects the user to the IDP.
            </div>
            <div class="callout">
              <span class="callout-icon">🔗</span>
              <div class="callout-body">
                <strong>My Domain is required for SP-Initiated SSO</strong>
                Without My Domain, Salesforce cannot use a custom login URL to trigger the SAML flow and cannot support deep linking with RelayState.
              </div>
            </div>
          </div>
        `
    },
    {
      title: 'Salesforce Sends AuthnRequest',
      actor: 'Salesforce (SP)',
      actorLabel: 'Salesforce (SP)',
      actorClass: 'actor-authserver',
      content: () => `
          <div class="step-header">
            <span class="actor-badge actor-authserver">Salesforce (SP)</span>
            <h2>Step 3 — Salesforce Generates and Sends the SAML AuthnRequest</h2>
            <p>Salesforce builds a SAML AuthnRequest XML document, signs it, encodes it, and redirects the browser to the IDP's SSO URL with the request as a URL parameter.</p>
          </div>

          <div class="section">
            <div class="section-title">SAML AuthnRequest</div>
            <div class="data-card">
              <div class="data-card-header">AuthnRequest XML — key fields</div>
              <pre>&lt;<span class="key">samlp:AuthnRequest</span>
  <span class="key">ID</span>="<span class="val">_a8f3c1d94e724b0a88f21c6d9e0b3f5a</span>"
  <span class="key">Version</span>="<span class="val">2.0</span>"
  <span class="key">IssueInstant</span>="<span class="val">2026-04-25T10:00:00Z</span>"
  <span class="key">Destination</span>="<span class="val">https://idp.example.com/sso/saml</span>"
  <span class="comment">                // IDP's SSO URL — where this request is going</span>
  <span class="key">AssertionConsumerServiceURL</span>="<span class="val">https://mycompany.my.salesforce.com?so=00Dax...</span>"
  <span class="comment">                // Salesforce ACS URL — where the IDP must POST the SAML Response</span>
  <span class="key">ProtocolBinding</span>="<span class="val">urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST</span>"&gt;
  &lt;<span class="key">saml:Issuer</span>&gt;<span class="val">https://saml.salesforce.com</span>&lt;/saml:Issuer&gt;
  <span class="comment">                // Salesforce's Entity ID — tells the IDP who is making the request</span>
&lt;/samlp:AuthnRequest&gt;</pre>
            </div>
          </div>

          <div class="section">
            <div class="section-title">HTTP Redirect to the IDP (most common binding)</div>
            <div class="data-card">
              <div class="data-card-header">Browser redirect — Salesforce → User → IDP
                <span class="direction-badge dir-send">HTTP 302 Redirect</span>
              </div>
              <pre>HTTP/1.1 302 Found
Location: https://idp.example.com/sso/saml
  ?<span class="key">SAMLRequest</span>=<span class="val">fZJNb8IwDIbv+x...</span>
  <span class="comment">  // Deflate-compressed, base64-encoded AuthnRequest XML</span>
  &<span class="key">RelayState</span>=<span class="val">https%3A%2F%2Fmycompany.my.salesforce.com%2F001%2Fo</span>
  <span class="comment">  // The original URL the user was trying to reach — preserved for after SSO</span>
  &<span class="key">SigAlg</span>=<span class="val">http%3A%2F%2Fwww.w3.org%2F2001%2F04%2Fxmldsig-more%23rsa-sha256</span>
  &<span class="key">Signature</span>=<span class="val">Yf3mVk8X2nR9wC4dF7jHaE1...</span>
  <span class="comment">  // Salesforce signs the request — IDP can verify Salesforce's identity</span></pre>
            </div>
          </div>

          <div class="callout">
            <span class="callout-icon">📋</span>
            <div class="callout-body">
              <strong>RelayState preserves the deep link</strong>
              If the user was trying to open <code>/001/o</code> (Accounts list), that URL is encoded in RelayState. After SSO, the IDP includes it in the POST response and Salesforce redirects the user to that page — not the default home page.
            </div>
          </div>
        `
    },
    {
      title: 'IDP Authenticates User',
      actor: 'IDP',
      actorLabel: 'IDP',
      actorClass: 'actor-user',
      content: () => `
          <div class="step-header">
            <span class="actor-badge actor-user">IDP</span>
            <h2>Step 4 — IDP Authenticates the User</h2>
            <p>The browser follows the redirect to the IDP. The IDP receives the AuthnRequest, validates it, and presents the user with a login page (if no active IDP session). The user authenticates with their corporate credentials.</p>
          </div>

          <div class="section">
            <div class="section-title">What the IDP validates in the AuthnRequest</div>
            <div class="explanation-box">
              <ul>
                <li><span class="hl-green">Signature</span> — verifies Salesforce signed the request with its private key (using the SP's certificate registered in the IDP)</li>
                <li><span class="hl-green">Issuer</span> — must match the Entity ID registered for this SP in the IDP</li>
                <li><span class="hl-green">Destination</span> — must equal the IDP's own SSO URL</li>
                <li><span class="hl-yellow">ACS URL</span> — must match the registered ACS URL for this SP — the IDP will POST the response here</li>
              </ul>
            </div>
          </div>

          <div class="section">
            <div class="section-title">User authenticates with the IDP</div>
            <div class="explanation-box">
              <ul>
                <li>IDP shows its login page (username + password, MFA, smart card, etc.)</li>
                <li>User enters corporate credentials</li>
                <li>IDP validates credentials against its directory (Active Directory, LDAP, etc.)</li>
                <li>Authentication successful → IDP generates a SAML Response</li>
              </ul>
            </div>
            <div class="callout">
              <span class="callout-icon">🏢</span>
              <div class="callout-body">
                <strong>Existing IDP session = no login prompt</strong>
                If the user already has an active session with the IDP (e.g., logged into Okta this morning), the IDP may skip the login form entirely and issue the SAML Response immediately.
              </div>
            </div>
          </div>
        `
    },
    {
      title: 'IDP Sends SAML Response',
      actor: 'IDP',
      actorLabel: 'IDP',
      actorClass: 'actor-user',
      content: () => `
          <div class="step-header">
            <span class="actor-badge actor-user">IDP</span>
            <h2>Step 5 — IDP Issues and POSTs the SAML Response</h2>
            <p>Authentication successful. The IDP builds a SAML Response XML containing the user's identity as a <strong>SAML Assertion</strong>, signs it with its private key, and POSTs it to Salesforce's ACS URL via the browser.</p>
          </div>

          <div class="section">
            <div class="section-title">SAML Response structure</div>
            <div class="data-card">
              <div class="data-card-header">SAML Response XML — key elements</div>
              <pre>&lt;<span class="key">samlp:Response</span>
  <span class="key">Destination</span>="<span class="val">https://mycompany.my.salesforce.com?so=00Dax...</span>"&gt;
  <span class="comment">               // Must match the ACS URL — Salesforce validates this</span>

  &lt;<span class="key">saml:Issuer</span>&gt;<span class="val">https://idp.example.com/issuer</span>&lt;/saml:Issuer&gt;
  <span class="comment">               // IDP's Entity ID — Salesforce matches against SSO Settings</span>

  &lt;<span class="key">samlp:Status</span>&gt;
    &lt;samlp:StatusCode Value="<span class="val">urn:oasis:names:tc:SAML:2.0:status:Success</span>"/&gt;
  &lt;/samlp:Status&gt;

  &lt;<span class="key">saml:Assertion</span>&gt;
    &lt;<span class="key">saml:Subject</span>&gt;
      &lt;<span class="key">saml:NameID</span> Format="<span class="val">emailAddress</span>"&gt;
        <span class="val">user@example.com</span>
      &lt;/saml:NameID&gt;
      <span class="comment">               // The user identifier — Salesforce uses this to find/match the user</span>
    &lt;/saml:Subject&gt;

    &lt;<span class="key">saml:Conditions</span>
      <span class="key">NotBefore</span>="<span class="val">2026-04-25T09:59:50Z</span>"
      <span class="key">NotOnOrAfter</span>="<span class="val">2026-04-25T10:05:00Z</span>"/&gt;

    &lt;<span class="key">saml:AttributeStatement</span>&gt;
      <span class="comment">// Optional attributes — used for JIT user provisioning</span>
      &lt;saml:Attribute Name="<span class="val">firstName</span>"&gt;&lt;saml:AttributeValue&gt;<span class="val">Jane</span>&lt;/saml:AttributeValue&gt;&lt;/saml:Attribute&gt;
      &lt;saml:Attribute Name="<span class="val">lastName</span>"&gt;&lt;saml:AttributeValue&gt;<span class="val">Doe</span>&lt;/saml:AttributeValue&gt;&lt;/saml:Attribute&gt;
      &lt;saml:Attribute Name="<span class="val">email</span>"&gt;&lt;saml:AttributeValue&gt;<span class="val">user@example.com</span>&lt;/saml:AttributeValue&gt;&lt;/saml:Attribute&gt;
    &lt;/saml:AttributeStatement&gt;

    &lt;<span class="key">ds:Signature</span>&gt;...&lt;/ds:Signature&gt;
    <span class="comment">               // IDP signs the assertion with its private key</span>
  &lt;/saml:Assertion&gt;
&lt;/samlp:Response&gt;</pre>
            </div>
          </div>

          <div class="section">
            <div class="section-title">How the SAML Response reaches Salesforce</div>
            <div class="data-card">
              <div class="data-card-header">IDP → Browser → Salesforce ACS URL (HTTP POST via auto-submit form)</div>
              <pre><span class="comment">&lt;!-- IDP returns an HTML page with a hidden auto-submitting form --&gt;</span>
&lt;form method="POST" action="<span class="val">https://mycompany.my.salesforce.com?so=00Dax...</span>"&gt;
  &lt;input type="hidden" name="<span class="key">SAMLResponse</span>" value="<span class="val">PHNhbWxwOlJlc3BvbnNlIHhtbG5z...</span>"/&gt;
  <span class="comment">&lt;!-- base64-encoded SAML Response XML --&gt;</span>
  &lt;input type="hidden" name="<span class="key">RelayState</span>" value="<span class="val">https%3A%2F%2Fmycompany.my.salesforce.com%2F001%2Fo</span>"/&gt;
&lt;/form&gt;
&lt;script&gt;document.forms[0].submit();&lt;/script&gt;</pre>
            </div>
          </div>
        `
    },
    {
      title: 'Salesforce Validates SAML Response',
      actor: 'Salesforce (SP)',
      actorLabel: 'Salesforce (SP)',
      actorClass: 'actor-authserver',
      content: () => `
          <div class="step-header">
            <span class="actor-badge actor-authserver">Salesforce (SP)</span>
            <h2>Step 6 — Salesforce Validates the SAML Response</h2>
            <p>Salesforce receives the POST at its ACS URL and performs a chain of cryptographic and semantic checks on the SAML Response before creating a session.</p>
          </div>

          <div class="section">
            <div class="section-title">Validation steps (in order)</div>
            <div class="explanation-box">
              <ul>
                <li><span class="hl-green">1. Decode</span> — base64-decode the SAMLResponse parameter to get the XML</li>
                <li><span class="hl-green">2. Verify signature</span> — validate the XML digital signature using the IDP's certificate uploaded in SSO Settings</li>
                <li><span class="hl-green">3. Check Issuer</span> — must match the configured IDP Entity ID in SSO Settings</li>
                <li><span class="hl-green">4. Check Destination</span> — must equal the Salesforce ACS URL</li>
                <li><span class="hl-yellow">5. Check Conditions</span> — <code>NotBefore</code> and <code>NotOnOrAfter</code> timestamps must be valid (clock skew tolerance applies)</li>
                <li><span class="hl-yellow">6. Check AudienceRestriction</span> — Audience must equal the Salesforce Entity ID</li>
                <li><span class="highlight">7. Match the user</span> — Salesforce looks up the user by the NameID value (or mapped attribute). User must exist in Salesforce (or JIT creates them).</li>
                <li><span class="highlight">8. Check user is active</span> — the matched Salesforce user must be active and have a valid license</li>
              </ul>
            </div>
            <div class="callout">
              <span class="callout-icon">🔏</span>
              <div class="callout-body">
                <strong>The XML signature is the core security guarantee</strong>
                Only the IDP holding the private key can produce a valid signature. If verification passes using the uploaded IDP certificate, Salesforce knows with cryptographic certainty the assertion came from the trusted IDP.
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">JIT provisioning — if enabled</div>
            <div class="explanation-box">
              If Just-In-Time provisioning is enabled and the user doesn't exist yet:
              <ul>
                <li>Salesforce creates a new User record using attributes from the <code>&lt;AttributeStatement&gt;</code></li>
                <li>Standard mapping: SAML attributes → User fields (FirstName, LastName, Email, etc.)</li>
                <li>Custom logic via <code>Auth.SamlJitHandler</code> Apex class if more complex provisioning is needed</li>
                <li>On subsequent logins, JIT can also <strong>update</strong> existing user attributes from the assertion</li>
              </ul>
            </div>
          </div>
        `
    },
    {
      title: 'Session Created, User Redirected',
      actor: 'Salesforce (SP)',
      actorLabel: 'Salesforce (SP)',
      actorClass: 'actor-authserver',
      content: () => `
          <div class="step-header">
            <span class="actor-badge actor-authserver">Salesforce (SP)</span>
            <h2>Step 7 — Salesforce Creates Session and Redirects User</h2>
            <p>Validation passed. Salesforce creates an authenticated session for the user and redirects the browser to the original destination — using the <strong>RelayState</strong> value if present.</p>
          </div>

          <div class="section">
            <div class="section-title">Session created</div>
            <div class="data-card">
              <div class="data-card-header">Salesforce → Browser (redirect to destination)</div>
              <pre>HTTP/1.1 302 Found
Location: <span class="val">https://mycompany.my.salesforce.com/001/o</span>
Set-Cookie: <span class="key">sid</span>=<span class="val">00Dax0000000001EAA!ARQAQKGnqC3vVf7Q8xmLg...</span>; Secure; HttpOnly
<span class="comment">// RelayState = /001/o → user lands on Accounts list, not the home page</span>
<span class="comment">// Salesforce session cookie set — user is now authenticated</span></pre>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Flow summary</div>
            <div class="explanation-box">
              <ul>
                <li><span class="hl-green">User hits</span> Salesforce My Domain URL</li>
                <li><span class="hl-yellow">Salesforce generates</span> signed SAML AuthnRequest → redirects browser to IDP</li>
                <li><span class="highlight">IDP authenticates</span> user (login page or existing session)</li>
                <li><span class="hl-yellow">IDP POSTs</span> signed SAML Response to Salesforce ACS URL via browser auto-submit form</li>
                <li><span class="hl-green">Salesforce validates</span> signature, timestamps, issuer, audience, user match</li>
                <li><span class="hl-green">Session created</span> — user redirected to original destination (RelayState)</li>
              </ul>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Encrypted assertions</div>
            <div class="explanation-box">
              Salesforce also supports <strong>encrypted SAML assertions</strong>. The IDP encrypts the assertion using Salesforce's public certificate before POSTing. Salesforce decrypts it using its private key (the decryption certificate configured in SSO Settings). This adds confidentiality on top of the integrity guarantee from the XML signature.
            </div>
          </div>
        `
    }
  ]
};

// SP-Initiated SSO: Salesforce as Identity Provider
window.flows.spinitsso_idp = {
  title: 'SP-Initiated SSO — Salesforce as IDP',
  steps: [
    {
      title: 'Overview',
      actor: 'intro',
      actorLabel: 'Introduction',
      actorClass: 'actor-client',
      content: () => `
          <div class="step-header">
            <span class="actor-badge actor-client">Introduction</span>
            <h2>SP-Initiated SSO — Salesforce as Identity Provider</h2>
            <p>In this variant, Salesforce is the <strong>Identity Provider (IDP)</strong> — it authenticates users and issues SAML Responses to external Service Providers (third-party apps). The flow is initiated by the user hitting the <strong>external SP</strong>, which redirects to Salesforce to handle authentication.</p>
          </div>

          ${buildActorsLegend('spinitsso_idp')}

          <div class="section">
            <div class="section-title">Roles in this flow</div>
            <div class="explanation-box">
              <ul>
                <li><span class="highlight">Service Provider (SP)</span> — the external application (Google Workspace, Slack, Workday, any SAML-enabled app). Initiates the flow and receives the SAML Response.</li>
                <li><span class="hl-yellow">Identity Provider (IDP)</span> — Salesforce. Authenticates the user and issues the SAML Response.</li>
                <li><span class="hl-green">User / Browser</span> — messenger between SP and Salesforce IDP.</li>
              </ul>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Salesforce prerequisites</div>
            <div class="explanation-box">
              <ul>
                <li><span class="highlight">Enable Identity Provider</span> — in Setup → Identity Provider → Enable Identity Provider. Requires My Domain.</li>
                <li><span class="hl-yellow">Connected App per SP</span> — create a Connected App for each external service provider. Configure the SP's ACS URL and Entity ID in the connected app.</li>
                <li><span class="hl-green">Assign users</span> — grant access to the connected app via profiles or permission sets. Only assigned users can SSO to that SP.</li>
                <li><span class="highlight">Optional: validate SP's AuthnRequest signature</span> — upload the SP's signing certificate to the connected app to verify the SP's request signatures.</li>
              </ul>
            </div>
            <div class="callout">
              <span class="callout-icon">🚀</span>
              <div class="callout-body">
                <strong>App Launcher as the IDP-initiated entry point</strong>
                When a user clicks a connected app tile in the Salesforce App Launcher, Salesforce sends the SAML Response to the SP using the connected app's <strong>Start URL</strong> as the RelayState. This is technically IDP-initiated — but Salesforce as IDP supports both directions.
              </div>
            </div>
          </div>
        `
    },
    {
      title: 'Setup: Configure Connected App for SP',
      actor: 'intro',
      actorLabel: 'One-time Setup',
      actorClass: 'actor-client',
      content: () => `
          <div class="step-header">
            <span class="actor-badge actor-client">One-time Setup</span>
            <h2>Step 1 — Configure Salesforce Identity Provider and Connected App</h2>
            <p>Enable Salesforce as an IDP and create a Connected App for the external SP. The SP also needs to be configured with Salesforce's IDP metadata.</p>
          </div>

          <div class="section">
            <div class="section-title">Enable Salesforce Identity Provider</div>
            <div class="data-card">
              <div class="data-card-header">Setup → Identity Provider → Enable Identity Provider</div>
              <pre><span class="comment">// Requires My Domain to be deployed</span>
<span class="comment">// Salesforce auto-generates a self-signed certificate for signing SAML Responses</span>
<span class="comment">// You can replace this with a CA-signed certificate for production</span>

<span class="comment">// Salesforce IDP metadata URL (give this to the SP):</span>
<span class="key">IDP Metadata URL</span>: <span class="val">https://mycompany.my.salesforce.com/.well-known/samlidp.xml</span>
<span class="key">IDP SSO URL</span>:      <span class="val">https://mycompany.my.salesforce.com/idp/endpoint/HttpPost</span>
<span class="key">IDP Certificate</span>:  <span class="val">[downloadable from Setup → Identity Provider]</span></pre>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Create a Connected App for the SP</div>
            <div class="data-card">
              <div class="data-card-header">Setup → App Manager → New Connected App → Enable SAML</div>
              <pre><span class="comment">// Values you get from the external SP:</span>
<span class="key">Entity ID</span>:          <span class="val">https://sp.example.com/saml/entity</span>
<span class="comment">                    // SP's SAML Entity ID</span>
<span class="key">ACS URL</span>:            <span class="val">https://sp.example.com/saml/acs</span>
<span class="comment">                    // Where Salesforce POSTs the SAML Response</span>
<span class="key">Subject Type</span>:       <span class="val">Username</span>  <span class="comment">// or Federation ID, Email, etc.</span>
<span class="key">Name ID Format</span>:     <span class="val">urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress</span>
<span class="key">Start URL</span>:          <span class="val">https://sp.example.com/dashboard</span>
<span class="comment">                    // Used as RelayState when accessed from App Launcher</span>

<span class="comment">// Assign profiles/permission sets to control who can SSO to this SP</span></pre>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Optional: SAML Response encryption</div>
            <div class="explanation-box">
              If the SP requires encrypted assertions, upload the SP's encryption certificate to the connected app. Salesforce will encrypt the SAML Assertion in the response using the SP's public key. Only the SP can decrypt it with its private key.
            </div>
          </div>
        `
    },
    {
      title: 'User Accesses External SP',
      actor: 'User / Browser',
      actorLabel: 'User / Browser',
      actorClass: 'actor-user',
      content: () => `
          <div class="step-header">
            <span class="actor-badge actor-user">User / Browser</span>
            <h2>Step 2 — User Accesses the External Service Provider</h2>
            <p>The user navigates to the external app (the SP). The SP detects the user is not authenticated, builds a SAML AuthnRequest, and redirects the browser to Salesforce (the IDP).</p>
          </div>

          <div class="section">
            <div class="section-title">SP redirects to Salesforce IDP</div>
            <div class="data-card">
              <div class="data-card-header">SP → Browser → Salesforce IDP (HTTP Redirect)
                <span class="direction-badge dir-send">HTTP 302 Redirect</span>
              </div>
              <pre>HTTP/1.1 302 Found
Location: https://mycompany.my.salesforce.com/idp/endpoint/HttpPost
  ?<span class="key">SAMLRequest</span>=<span class="val">fZJNb8IwDIbv+x...</span>
  <span class="comment">  // SP's SAML AuthnRequest — base64 encoded</span>
  &<span class="key">RelayState</span>=<span class="val">https%3A%2F%2Fsp.example.com%2Fdashboard</span>
  <span class="comment">  // The SP page the user was trying to reach</span></pre>
            </div>
          </div>
        `
    },
    {
      title: 'Salesforce Authenticates User',
      actor: 'Salesforce (IDP)',
      actorLabel: 'Salesforce (IDP)',
      actorClass: 'actor-authserver',
      content: () => `
          <div class="step-header">
            <span class="actor-badge actor-authserver">Salesforce (IDP)</span>
            <h2>Step 3 — Salesforce Validates the AuthnRequest and Authenticates the User</h2>
            <p>Salesforce receives the AuthnRequest, validates it against the connected app configuration, and presents the Salesforce login page if the user doesn't have an active session.</p>
          </div>

          <div class="section">
            <div class="section-title">Salesforce validates the AuthnRequest</div>
            <div class="explanation-box">
              <ul>
                <li><span class="hl-green">Entity ID</span> — matches a configured connected app</li>
                <li><span class="hl-green">ACS URL</span> — matches the ACS URL in the connected app</li>
                <li><span class="hl-yellow">Signature</span> — if the SP's signing certificate is configured, Salesforce verifies the request signature</li>
                <li><span class="highlight">User access</span> — after login, confirms the user's profile/permission set has access to this connected app</li>
              </ul>
            </div>
          </div>

          <div class="section">
            <div class="section-title">User logs into Salesforce</div>
            <div class="explanation-box">
              <ul>
                <li>No active Salesforce session → Salesforce presents its login page (My Domain login)</li>
                <li>Active Salesforce session → Salesforce skips the login form</li>
                <li>User authenticates with Salesforce credentials (username + password, MFA, etc.)</li>
              </ul>
            </div>
          </div>
        `
    },
    {
      title: 'Salesforce Issues SAML Response',
      actor: 'Salesforce (IDP)',
      actorLabel: 'Salesforce (IDP)',
      actorClass: 'actor-authserver',
      content: () => `
          <div class="step-header">
            <span class="actor-badge actor-authserver">Salesforce (IDP)</span>
            <h2>Step 4 — Salesforce Issues the SAML Response</h2>
            <p>Authentication successful. Salesforce builds a SAML Response, signs it with its IDP certificate, and POSTs it to the SP's ACS URL via the browser.</p>
          </div>

          <div class="section">
            <div class="section-title">SAML Response from Salesforce</div>
            <div class="data-card">
              <div class="data-card-header">Salesforce IDP → Browser → SP ACS URL (HTTP POST)</div>
              <pre>&lt;<span class="key">samlp:Response</span>
  <span class="key">Destination</span>="<span class="val">https://sp.example.com/saml/acs</span>"&gt;

  &lt;<span class="key">saml:Issuer</span>&gt;<span class="val">https://mycompany.my.salesforce.com</span>&lt;/saml:Issuer&gt;

  &lt;<span class="key">saml:Assertion</span>&gt;
    &lt;<span class="key">saml:Subject</span>&gt;
      &lt;<span class="key">saml:NameID</span>&gt;<span class="val">user@example.com</span>&lt;/saml:NameID&gt;
      <span class="comment">// Value determined by the connected app's Subject Type setting</span>
    &lt;/saml:Subject&gt;

    &lt;<span class="key">saml:AttributeStatement</span>&gt;
      <span class="comment">// Salesforce user attributes — configurable in the connected app</span>
      <span class="comment">// e.g., email, firstName, lastName, userId, etc.</span>
    &lt;/saml:AttributeStatement&gt;

    &lt;<span class="key">ds:Signature</span>&gt;...&lt;/ds:Signature&gt;
    <span class="comment">// Signed with Salesforce's IDP private key</span>
  &lt;/saml:Assertion&gt;
&lt;/samlp:Response&gt;</pre>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Auto-submit POST to SP ACS URL</div>
            <div class="data-card">
              <div class="data-card-header">Browser auto-submits to SP</div>
              <pre><span class="comment">&lt;!-- Salesforce returns an HTML page with auto-submitting form --&gt;</span>
&lt;form method="POST" action="<span class="val">https://sp.example.com/saml/acs</span>"&gt;
  &lt;input type="hidden" name="<span class="key">SAMLResponse</span>" value="<span class="val">PHNhbWxwOlJlc3BvbnNlIHhtbG5z...</span>"/&gt;
  &lt;input type="hidden" name="<span class="key">RelayState</span>" value="<span class="val">https%3A%2F%2Fsp.example.com%2Fdashboard</span>"/&gt;
&lt;/form&gt;</pre>
            </div>
          </div>
        `
    },
    {
      title: 'SP Validates & Creates Session',
      actor: 'SP',
      actorLabel: 'Service Provider',
      actorClass: 'actor-client',
      content: () => `
          <div class="step-header">
            <span class="actor-badge actor-client">Service Provider</span>
            <h2>Step 5 — SP Validates the SAML Response and Creates a Session</h2>
            <p>The external SP receives the POST, validates the SAML Response using Salesforce's IDP certificate, matches the user, creates a local session, and redirects the user to the destination (RelayState).</p>
          </div>

          <div class="section">
            <div class="section-title">SP validation steps</div>
            <div class="explanation-box">
              <ul>
                <li><span class="hl-green">Verify signature</span> — using Salesforce's IDP certificate (downloaded from Setup → Identity Provider)</li>
                <li><span class="hl-green">Check Issuer</span> — must match Salesforce's Entity ID</li>
                <li><span class="hl-green">Check Destination</span> — must equal the SP's own ACS URL</li>
                <li><span class="hl-yellow">Check Conditions</span> — timestamps must be valid</li>
                <li><span class="highlight">Match user</span> — find or create the user in the SP's system using the NameID</li>
                <li><span class="highlight">Create session</span> — user is now authenticated in the SP</li>
              </ul>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Flow summary — Salesforce as IDP</div>
            <div class="explanation-box">
              <ul>
                <li><span class="hl-green">User hits</span> external SP — redirected to Salesforce IDP with SAML AuthnRequest</li>
                <li><span class="hl-yellow">Salesforce validates</span> AuthnRequest against connected app config</li>
                <li><span class="highlight">User logs into Salesforce</span> (or existing session used)</li>
                <li><span class="hl-yellow">Salesforce POSTs</span> signed SAML Response to SP's ACS URL</li>
                <li><span class="hl-green">SP validates</span> signature, creates session, redirects user to destination</li>
              </ul>
            </div>
          </div>
        `
    }
  ]
};
