// ─── Flow diagram definitions ──────────────────────────────────────────────────
window.flowDiagrams = {

  spinitsso: {
    nodes: [
      { id: 'user', label: 'USER / BROWSER', colorVar: '--accent2', sub: 'Messenger between SP & IDP' },
      { id: 'sf',   label: 'SALESFORCE (SP)', colorVar: '--accent',  sub: 'Service Provider' },
      { id: 'idp',  label: 'IDP',             colorVar: '--yellow',  sub: 'Identity Provider' },
    ],
    steps: [
      /* 0 overview       */ [],
      /* 1 setup          */ [{ from:'sf',   to:'idp',  label:'Exchange metadata\nACS URL, Entity ID, certificates' }],
      /* 2 user hits sf   */ [{ from:'user', to:'sf',   label:'Access My Domain URL\n(unauthenticated)' }],
      /* 3 sf authnreq    */ [{ from:'sf',   to:'idp',  label:'Redirect with SAML AuthnRequest\n+ RelayState', via:'user' }],
      /* 4 idp authn      */ [{ from:'user', to:'idp',  label:'Login page → credentials' }],
      /* 5 idp response   */ [{ from:'idp',  to:'sf',   label:'POST SAMLResponse\nto ACS URL', via:'user' }],
      /* 6 sf validates   */ [{ from:'sf',   to:'sf',   label:'Verify signature, issuer,\ntimestamps, user match', self:true }],
      /* 7 session        */ [{ from:'sf',   to:'user', label:'Session created\nRedirect to RelayState' }],
    ]
  },

  spinitsso_idp: {
    nodes: [
      { id: 'user', label: 'USER / BROWSER', colorVar: '--accent2', sub: 'Messenger between SP & IDP' },
      { id: 'sp',   label: 'SERVICE PROVIDER', colorVar: '--accent',  sub: 'External app' },
      { id: 'sf',   label: 'SALESFORCE (IDP)', colorVar: '--yellow',  sub: 'Identity Provider' },
    ],
    steps: [
      /* 0 overview       */ [],
      /* 1 setup          */ [{ from:'sf',   to:'sp',   label:'Enable IDP, create Connected App\nShare IDP metadata' }],
      /* 2 user hits sp   */ [{ from:'user', to:'sp',   label:'Access external SP\n(unauthenticated)' }],
      /* 3 sp authnreq    */ [{ from:'sp',   to:'sf',   label:'Redirect with SAML AuthnRequest\n+ RelayState', via:'user' }],
      /* 4 sf authn       */ [{ from:'user', to:'sf',   label:'Login to Salesforce\n(or existing session)' }],
      /* 5 sf response    */ [{ from:'sf',   to:'sp',   label:'POST SAMLResponse\nto SP ACS URL', via:'user' }],
      /* 6 sp validates   */ [{ from:'sp',   to:'user', label:'Validate signature, create session\nRedirect to RelayState' }],
    ]
  },

  pkce: {
    nodes: [
      { id: 'app',  label: 'CLIENT APP',     colorVar: '--accent',  sub: 'Your app (SPA/Mobile)' },
      { id: 'user', label: 'USER / BROWSER', colorVar: '--accent2', sub: 'Logs in interactively' },
      { id: 'auth', label: 'AUTH SERVER',    colorVar: '--yellow',  sub: 'Salesforce Connected App' },
      { id: 'api',  label: 'RESOURCE API',   colorVar: '--green',   sub: 'Protected resource' },
    ],
    steps: [
      /* 0 overview    */ [],
      /* 1 gen pkce    */ [{ from:'app',  to:'app',  label:'Generate verifier\n& challenge', self:true }],
      /* 2 build url   */ [{ from:'app',  to:'user', label:'Redirect to\nauth server' }],
      /* 3 user login  */ [{ from:'user', to:'auth', label:'Login + consent' }, { from:'auth', to:'user', label:'Store challenge\nIssue auth code' }],
      /* 4 recv code   */ [{ from:'auth', to:'app',  label:'Redirect with\nauth code + state', via:'user' }],
      /* 5 exchange    */ [{ from:'app',  to:'auth', label:'POST code +\ncode_verifier' }],
      /* 6 recv tokens */ [{ from:'auth', to:'app',  label:'access_token\nrefresh_token\nid_token' }],
      /* 7 call api    */ [{ from:'app',  to:'api',  label:'Bearer token\nAPI request' }, { from:'api', to:'app', label:'Protected\nresource' }],
      /* 8 refresh     */ [{ from:'app',  to:'auth', label:'POST refresh_token' }, { from:'auth', to:'app', label:'New access_token' }],
    ]
  },

  clientcredentials: {
    nodes: [
      { id: 'svc',  label: 'CLIENT SERVICE', colorVar: '--accent', sub: 'Backend app / daemon' },
      { id: 'auth', label: 'AUTH SERVER',    colorVar: '--yellow', sub: 'Salesforce Connected App' },
      { id: 'api',  label: 'RESOURCE API',   colorVar: '--green',  sub: 'Protected service' },
    ],
    steps: [
      /* 0 overview   */ [],
      /* 1 prepare    */ [{ from:'svc',  to:'svc',  label:'Load client_id\n& client_secret', self:true }],
      /* 2 request    */ [{ from:'svc',  to:'auth', label:'POST grant_type=\nclient_credentials' }],
      /* 3 validates  */ [{ from:'auth', to:'auth', label:'Verify id + secret\nCheck scopes', self:true }],
      /* 4 recv token */ [{ from:'auth', to:'svc',  label:'access_token' }],
      /* 5 call api   */ [{ from:'svc',  to:'api',  label:'Bearer token\nAPI request' }, { from:'api', to:'svc', label:'Protected\nresource' }],
      /* 6 re-auth    */ [{ from:'svc',  to:'auth', label:'POST again when\ntoken expires' }, { from:'auth', to:'svc', label:'New access_token' }],
    ]
  },

  jwt: {
    nodes: [
      { id: 'svc',  label: 'CLIENT SERVICE', colorVar: '--accent', sub: 'Holds private key' },
      { id: 'auth', label: 'AUTH SERVER',     colorVar: '--yellow', sub: 'Connected App + pre-auth user' },
      { id: 'api',  label: 'RESOURCE API',   colorVar: '--green',  sub: 'Protected service' },
    ],
    steps: [
      /* 0 overview   */ [],
      /* 1 keygen     */ [{ from:'svc',  to:'svc',  label:'Generate cert keypair\nupload public cert to\nConnected App', self:true }],
      /* 2 build jwt  */ [{ from:'svc',  to:'svc',  label:'Build JWT: iss=ConsumerKey\nsub=username, aud=login.sf.com\nSign with private key', self:true }],
      /* 3 post       */ [{ from:'svc',  to:'auth', label:'POST assertion=<JWT>\ngrant_type=jwt-bearer URN' }],
      /* 4 validates  */ [{ from:'auth', to:'auth', label:'Verify signature\nCheck sub user pre-authorized\nCheck claims', self:true }],
      /* 5 recv token */ [{ from:'auth', to:'svc',  label:'access_token\n(no refresh_token)' }],
      /* 6 call api   */ [{ from:'svc',  to:'api',  label:'Bearer token\nAPI request' }, { from:'api', to:'svc', label:'Protected\nresource' }],
    ]
  },

  canvas: {
    nodes: [
      { id: 'user', label: 'USER / BROWSER', colorVar: '--accent2', sub: 'Admin pre-authorized' },
      { id: 'sf',   label: 'SALESFORCE',      colorVar: '--yellow',  sub: 'Checks & POSTs signed request' },
      { id: 'app',  label: 'CANVAS APP',      colorVar: '--accent',  sub: 'Your server endpoint' },
      { id: 'api',  label: 'RESOURCE API',    colorVar: '--green',   sub: 'Salesforce REST API' },
    ],
    steps: [
      /* 0 overview       */ [],
      /* 1 connected app  */ [{ from:'app',  to:'sf',   label:'Configure Connected App\nSigned Request + Admin pre-auth' }],
      /* 2 user req page  */ [{ from:'user', to:'sf',   label:'Page request\n(already logged in)' }],
      /* 3 sf checks auth */ [{ from:'sf',   to:'sf',   label:'Check: user is\nadmin pre-authorized ✓', self:true }],
      /* 4 sf posts       */ [{ from:'sf',   to:'app',  label:'POST signed_request\n(HMAC + context + token)' }],
      /* 5 verify sig     */ [{ from:'app',  to:'app',  label:'Verify HMAC-SHA256\nsignature locally', self:true }],
      /* 6 decode         */ [{ from:'app',  to:'app',  label:'Decode context JSON\nextract oauthToken', self:true }],
      /* 7 call api       */ [{ from:'app',  to:'api',  label:'Bearer token\nAPI request' }, { from:'api', to:'app', label:'Protected\nresource' }],
    ]
  },

  canvasfirst: {
    nodes: [
      { id: 'user', label: 'USER / BROWSER', colorVar: '--accent2', sub: 'First-time, no approval yet' },
      { id: 'sf',   label: 'SALESFORCE',      colorVar: '--yellow',  sub: 'Auth server + signed request' },
      { id: 'app',  label: 'CANVAS APP',      colorVar: '--accent',  sub: 'Your server + OAuth client' },
      { id: 'api',  label: 'RESOURCE API',    colorVar: '--green',   sub: 'Salesforce REST API' },
    ],
    steps: [
      /* 0  overview          */ [],
      /* 1  connected app     */ [{ from:'app',  to:'sf',   label:'Configure Connected App\nSelf-auth + Callback URL' }],
      /* 2  user req page     */ [{ from:'user', to:'sf',   label:'Page request\n(no prior approval)' }],
      /* 3  iframe GET        */ [{ from:'sf',   to:'app',  label:'Load canvas in iframe\n?_sfdc_canvas_authvalue=\nuser_approval_required' }],
      /* 4  canvas starts oauth*/ [{ from:'app', to:'sf',   label:'oauth.login() →\nredirect to /authorize' }],
      /* 5  user consents     */ [{ from:'sf',   to:'user', label:'Show consent page' }, { from:'user', to:'sf', label:'User clicks Allow' }],
      /* 6  sf returns token  */ [{ from:'sf',   to:'user', label:'Redirect: access_token\n+ refresh_token in URI' }],
      /* 7  browser→callback  */ [{ from:'user', to:'app',  label:'GET /callback\n(access_token + refresh_token)' }],
      /* 8  repost()          */ [{ from:'app',  to:'sf',   label:'repost() → postMessage\n→ PUT /canvas/repost' }],
      /* 9  sf posts signed   */ [{ from:'sf',   to:'app',  label:'Refresh iframe →\nPOST signed_request' }],
      /* 10 verify sig        */ [{ from:'app',  to:'app',  label:'Verify HMAC-SHA256\nsignature locally', self:true }],
      /* 11 decode            */ [{ from:'app',  to:'app',  label:'Decode context JSON\nextract oauthToken', self:true }],
      /* 12 call api          */ [{ from:'app',  to:'api',  label:'Bearer token\nAPI request' }, { from:'api', to:'app', label:'Protected\nresource' }],
    ]
  },

  samlbearer: {
    nodes: [
      { id: 'svc',  label: 'CLIENT SERVICE', colorVar: '--accent', sub: 'Holds private key' },
      { id: 'auth', label: 'AUTH SERVER',     colorVar: '--yellow', sub: 'Connected App + pre-auth user' },
      { id: 'api',  label: 'RESOURCE API',   colorVar: '--green',  sub: 'Protected service' },
    ],
    steps: [
      /* 0 overview        */ [],
      /* 1 keygen          */ [{ from:'svc',  to:'svc',  label:'Generate cert keypair\nupload public cert to\nConnected App', self:true }],
      /* 2 build assertion */ [{ from:'svc',  to:'svc',  label:'Build SAML XML: Issuer=ConsumerKey\nNameID=username, Audience=login.sf.com\nSign XML with private key', self:true }],
      /* 3 post            */ [{ from:'svc',  to:'auth', label:'POST assertion=<base64url XML>\ngrant_type=saml2-bearer URN' }],
      /* 4 validates       */ [{ from:'auth', to:'auth', label:'Verify XML signature\nCheck NameID user pre-authorized\nCheck Audience & expiry', self:true }],
      /* 5 recv token      */ [{ from:'auth', to:'svc',  label:'access_token + instance_url\n(no refresh_token)' }],
      /* 6 call api        */ [{ from:'svc',  to:'api',  label:'Bearer token\nAPI request' }, { from:'api', to:'svc', label:'Protected\nresource' }],
    ]
  }
};

window.buildActorsLegend = function(flowKey) {
  const def = flowDiagrams[flowKey];
  if (!def) return '';

  const style   = getComputedStyle(document.documentElement);
  const cssVar  = v => style.getPropertyValue(v).trim();
  const C_SURFACE2 = cssVar('--surface2');
  const C_BORDER   = cssVar('--border');
  const C_MUTED    = cssVar('--muted');

  const nodes = def.nodes;
  const n     = nodes.length;
  const nodeW = 140, nodeH = 54, gap = 40;
  const W     = n * nodeW + (n - 1) * gap;
  const H     = 90;
  const nodeY = 18;

  const markerId = 'arr-legend';
  let svg = `<svg width="100%" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="max-width:${W}px">
    <defs>
      <marker id="${markerId}" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
        <path d="M0,0 L0,6 L6,3 z" fill="${C_BORDER}"/>
      </marker>
    </defs>`;

  nodes.forEach((nd, i) => {
    const col = cssVar(nd.colorVar);
    const x   = i * (nodeW + gap);
    const cx  = x + nodeW / 2;

    // connector arrow between nodes
    if (i < n - 1) {
      const x1 = x + nodeW, x2 = x + nodeW + gap, midY = nodeY + nodeH / 2;
      svg += `<line x1="${x1}" y1="${midY}" x2="${x2}" y2="${midY}"
        stroke="${C_BORDER}" stroke-width="1.5" marker-end="url(#${markerId})"/>`;
    }

    svg += `<rect x="${x}" y="${nodeY}" width="${nodeW}" height="${nodeH}" rx="8"
      fill="${col}1a" stroke="${col}" stroke-width="1.5"/>`;
    svg += `<text x="${cx}" y="${nodeY + 22}" text-anchor="middle"
      fill="${col}" font-size="11" font-weight="700" font-family="sans-serif">${nd.label}</text>`;
    if (nd.sub) {
      svg += `<text x="${cx}" y="${nodeY + 37}" text-anchor="middle"
        fill="${C_MUTED}" font-size="10" font-family="sans-serif">${nd.sub}</text>`;
    }
  });

  svg += '</svg>';
  return `<div class="section">
    <div class="section-title">Actors in this flow</div>
    <div class="flow-diagram" style="overflow-x:auto">${svg}</div>
  </div>`;
};

window.buildFlowDiagram = function(flowKey, stepIndex) {
  const def = flowDiagrams[flowKey];
  if (!def) return '';

  // Read live CSS variable values so the diagram respects the current theme
  const style = getComputedStyle(document.documentElement);
  const cssVar = v => style.getPropertyValue(v).trim();

  const C_SURFACE  = cssVar('--surface');
  const C_SURFACE2 = cssVar('--surface2');
  const C_BORDER   = cssVar('--border');
  const C_MUTED    = cssVar('--muted');
  const C_TEXT     = cssVar('--text');

  const nodes = def.nodes;
  const activeArrows = def.steps[stepIndex] || [];
  const n = nodes.length;

  // Height must fit both regular arrow lanes and self-loop label text
  const nonSelfArrows = activeArrows.filter(a => !a.self);
  const selfArrows    = activeArrows.filter(a => a.self);
  const maxArrows = Math.max(1, nonSelfArrows.length);
  const regularH = 20 + 40 + 18 + (maxArrows - 1) * 60 + 28 + 24;
  // self-loop: base of node(60) + loop curve(34) + label lines; r=28 so label starts at cy+r+20=nodeH+60+20=114 from nodeY
  const selfH = selfArrows.length
    ? 20 + 40 + 34 + 20 + Math.max(...selfArrows.map(a => a.label.split('\n').length)) * 14 + 16
    : 0;
  const W = 620, H = Math.max(regularH, selfH);
  const nodeW = 110, nodeH = 40;
  const gap = (W - n * nodeW) / (n + 1);
  const nodeY = 20;
  const arrowY = nodeY + nodeH;

  // Resolve each node's colour from its CSS variable
  const pos = nodes.map((nd, i) => ({
    ...nd,
    color: cssVar(nd.colorVar),
    x:  gap + i * (nodeW + gap),
    cx: gap + i * (nodeW + gap) + nodeW / 2,
    cy: nodeY + nodeH / 2,
  }));

  const posMap = {};
  pos.forEach(p => { posMap[p.id] = p; });

  // Collect which node ids are touched by the active arrows
  const activeNodeIds = new Set();
  activeArrows.forEach(a => { activeNodeIds.add(a.from); activeNodeIds.add(a.to); });

  // Build unique marker ids per colour so multi-colour arrows each get the right head
  const markerColours = {};
  activeArrows.forEach(a => {
    const from = posMap[a.from];
    if (from) markerColours[from.color] = true;
  });

  let defs = '<defs>';
  Object.keys(markerColours).forEach((col, i) => {
    const id = 'ah' + i;
    markerColours[col] = id; // store id for lookup
    defs += `<marker id="${id}" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
      <path d="M0,0 L0,7 L7,3.5 z" fill="${col}"/>
    </marker>`;
  });
  defs += '</defs>';

  let svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">${defs}`;

  // Draw ONLY active arrows
  activeArrows.forEach((arrow, ai) => {
    const from = posMap[arrow.from];
    const to   = posMap[arrow.to];
    if (!from || !to) return;

    const col      = from.color;
    const markerId = markerColours[col] || Object.values(markerColours)[0];

    if (arrow.self) {
      const cx = from.cx, cy = nodeY + nodeH;
      const r = 28;
      svg += `<path d="M${cx - 18},${cy} Q${cx - 18},${cy + r} ${cx},${cy + r + 6} Q${cx + 18},${cy + r} ${cx + 18},${cy}"
        fill="none" stroke="${col}" stroke-width="2" marker-end="url(#${markerId})"/>`;
      const lines = arrow.label.split('\n');
      const ty = cy + r + 20;
      lines.forEach((ln, li) => {
        svg += `<text x="${cx}" y="${ty + li * 14}" text-anchor="middle"
          fill="${col}" font-size="11" font-weight="600" font-family="sans-serif">${ln}</text>`;
      });
      return;
    }

    const fromIdx = nodes.findIndex(nd => nd.id === arrow.from);
    const toIdx   = nodes.findIndex(nd => nd.id === arrow.to);
    const goRight = toIdx > fromIdx;

    // Each arrow gets its own lane below the nodes; 60px per lane keeps labels clear
    const lineY = arrowY + 18 + ai * 60;
    const x1 = goRight ? from.x + nodeW : from.x;
    const x2 = goRight ? to.x           : to.x + nodeW;

    svg += `<line x1="${x1}" y1="${lineY}" x2="${x2}" y2="${lineY}"
      stroke="${col}" stroke-width="2" marker-end="url(#${markerId})"/>`;

    const lines = arrow.label.split('\n');
    const midX  = (x1 + x2) / 2;
    // Labels always sit below the arrow line
    lines.forEach((ln, li) => {
      svg += `<text x="${midX}" y="${lineY + 14 + li * 14}" text-anchor="middle"
        fill="${col}" font-size="11" font-weight="600" font-family="sans-serif">${ln}</text>`;
    });
  });

  // Draw nodes — active ones highlighted, inactive ones ghosted
  pos.forEach(p => {
    const isActive = activeNodeIds.has(p.id);
    const fill     = isActive ? p.color + '28' : C_SURFACE2;
    const stroke   = isActive ? p.color        : C_BORDER;
    const textCol  = isActive ? p.color        : C_MUTED;
    const sw       = isActive ? 2              : 1;

    svg += `<rect x="${p.x}" y="${nodeY}" width="${nodeW}" height="${nodeH}" rx="7"
      fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
    svg += `<text x="${p.cx}" y="${nodeY + nodeH / 2 + 4}" text-anchor="middle"
      fill="${textCol}" font-size="11" font-weight="700" font-family="sans-serif">${p.label}</text>`;
  });

  svg += '</svg>';
  return `<div class="flow-progress-wrap">
    <div class="section-title">Where you are in the flow</div>
    ${svg}
  </div>`;
};
