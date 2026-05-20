// ─── Flow diagram definitions ──────────────────────────────────────────────────
window.flowDiagrams = {

  pkce: {
    nodes: [
      { id: 'app',    label: 'Client App',   color: '#6c63ff' },
      { id: 'user',   label: 'User/Browser', color: '#4ecdc4' },
      { id: 'auth',   label: 'Auth Server',  color: '#f7c948' },
      { id: 'api',    label: 'Resource API', color: '#43d98c' },
    ],
    steps: [
      // stepIndex → array of { from, to, label, active }
      /* 0 overview    */ [],
      /* 1 gen pkce    */ [{ from:'app', to:'app', label:'Generate verifier\n& challenge', self:true }],
      /* 2 build url   */ [{ from:'app', to:'user', label:'Redirect to\nauth server' }],
      /* 3 user login  */ [{ from:'user', to:'auth', label:'Login + consent' }, { from:'auth', to:'user', label:'Store challenge\nIssue auth code' }],
      /* 4 recv code   */ [{ from:'auth', to:'app', label:'Redirect with\nauth code + state', via:'user' }],
      /* 5 exchange    */ [{ from:'app', to:'auth', label:'POST code +\ncode_verifier' }],
      /* 6 recv tokens */ [{ from:'auth', to:'app', label:'access_token\nrefresh_token\nid_token' }],
      /* 7 call api    */ [{ from:'app', to:'api', label:'Bearer token\nAPI request' }, { from:'api', to:'app', label:'Protected\nresource' }],
      /* 8 refresh     */ [{ from:'app', to:'auth', label:'POST refresh_token' }, { from:'auth', to:'app', label:'New access_token' }],
    ]
  },

  clientcredentials: {
    nodes: [
      { id: 'svc',  label: 'Client Service', color: '#6c63ff' },
      { id: 'auth', label: 'Auth Server',    color: '#f7c948' },
      { id: 'api',  label: 'Resource API',   color: '#43d98c' },
    ],
    steps: [
      /* 0 overview   */ [],
      /* 1 prepare    */ [{ from:'svc', to:'svc', label:'Load client_id\n& client_secret', self:true }],
      /* 2 request    */ [{ from:'svc', to:'auth', label:'POST grant_type=\nclient_credentials' }],
      /* 3 validates  */ [{ from:'auth', to:'auth', label:'Verify id + secret\nCheck scopes', self:true }],
      /* 4 recv token */ [{ from:'auth', to:'svc', label:'access_token' }],
      /* 5 call api   */ [{ from:'svc', to:'api', label:'Bearer token\nAPI request' }, { from:'api', to:'svc', label:'Protected\nresource' }],
      /* 6 re-auth    */ [{ from:'svc', to:'auth', label:'POST again when\ntoken expires' }, { from:'auth', to:'svc', label:'New access_token' }],
    ]
  },

  jwt: {
    nodes: [
      { id: 'svc',  label: 'Client Service', color: '#6c63ff' },
      { id: 'auth', label: 'Auth Server',    color: '#f7c948' },
      { id: 'api',  label: 'Resource API',   color: '#43d98c' },
    ],
    steps: [
      /* 0 overview   */ [],
      /* 1 keygen     */ [{ from:'svc', to:'svc', label:'Generate key pair\nregister public key', self:true }],
      /* 2 build jwt  */ [{ from:'svc', to:'svc', label:'Sign JWT assertion\nwith private key', self:true }],
      /* 3 post       */ [{ from:'svc', to:'auth', label:'POST client_assertion\n(signed JWT)' }],
      /* 4 validates  */ [{ from:'auth', to:'auth', label:'Verify signature\nCheck claims', self:true }],
      /* 5 recv token */ [{ from:'auth', to:'svc', label:'access_token' }],
      /* 6 call api   */ [{ from:'svc', to:'api', label:'Bearer token\nAPI request' }, { from:'api', to:'svc', label:'Protected\nresource' }],
    ]
  }
};

window.buildFlowDiagram = function(flowKey, stepIndex) {
  const def = flowDiagrams[flowKey];
  if (!def) return '';

  const nodes = def.nodes;
  const activeArrows = def.steps[stepIndex] || [];
  const n = nodes.length;

  const W = 620, H = 170;
  const nodeW = 110, nodeH = 40;
  const gap = (W - n * nodeW) / (n + 1);
  const nodeY = 20;
  const arrowY = nodeY + nodeH;

  // Positions
  const pos = nodes.map((nd, i) => ({
    ...nd,
    x: gap + i * (nodeW + gap),
    cx: gap + i * (nodeW + gap) + nodeW / 2,
    cy: nodeY + nodeH / 2
  }));

  const posMap = {};
  pos.forEach(p => { posMap[p.id] = p; });

  let svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <marker id="ah" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
      <path d="M0,0 L0,7 L7,3.5 z" fill="#6c63ff"/>
    </marker>
    <marker id="ah-dim" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
      <path d="M0,0 L0,7 L7,3.5 z" fill="#2e3248"/>
    </marker>
  </defs>`;

  // Draw active arrows first (behind nodes)
  activeArrows.forEach((arrow, ai) => {
    const from = posMap[arrow.from];
    const to   = posMap[arrow.to];
    if (!from || !to) return;

    if (arrow.self) {
      const cx = from.cx, cy = nodeY + nodeH;
      const r = 28;
      const offsetX = ai * 0 ;
      svg += `<path d="M${cx - 18},${cy} Q${cx - 18},${cy + r} ${cx},${cy + r + 6} Q${cx + 18},${cy + r} ${cx + 18},${cy}"
        fill="none" stroke="#6c63ff" stroke-width="1.8" stroke-dasharray="none" marker-end="url(#ah)"/>`;
      const lines = arrow.label.split('\n');
      const ty = cy + r + 22;
      lines.forEach((ln, li) => {
        svg += `<text x="${cx}" y="${ty + li * 13}" text-anchor="middle" fill="#6c63ff" font-size="10" font-family="sans-serif">${ln}</text>`;
      });
      return;
    }

    // Determine arrow direction
    const fromIdx = nodes.findIndex(nd => nd.id === arrow.from);
    const toIdx   = nodes.findIndex(nd => nd.id === arrow.to);
    const goRight = toIdx > fromIdx;

    // Stagger multiple arrows vertically
    const yOff = ai * 30;
    const lineY = arrowY + 18 + yOff;
    const x1 = goRight ? from.x + nodeW : from.x;
    const x2 = goRight ? to.x           : to.x + nodeW;

    svg += `<line x1="${x1}" y1="${lineY}" x2="${x2}" y2="${lineY}"
      stroke="#6c63ff" stroke-width="1.8" marker-end="url(#ah)"/>`;

    const lines = arrow.label.split('\n');
    const midX = (x1 + x2) / 2;
    lines.forEach((ln, li) => {
      svg += `<text x="${midX}" y="${lineY - 5 + li * 12}" text-anchor="middle" fill="#6c63ff" font-size="10" font-family="sans-serif">${ln}</text>`;
    });
  });

  // Draw inactive arrows (dimmed) for all non-active steps
  def.steps.forEach((stepArrows, si) => {
    if (si === stepIndex || si === 0) return;
    stepArrows.forEach(arrow => {
      if (arrow.self) return;
      const from = posMap[arrow.from];
      const to   = posMap[arrow.to];
      if (!from || !to) return;
      const fromIdx = nodes.findIndex(nd => nd.id === arrow.from);
      const toIdx   = nodes.findIndex(nd => nd.id === arrow.to);
      const goRight = toIdx > fromIdx;
      const x1 = goRight ? from.x + nodeW : from.x;
      const x2 = goRight ? to.x           : to.x + nodeW;
      const lineY = arrowY + 6;
      svg += `<line x1="${x1}" y1="${lineY}" x2="${x2}" y2="${lineY}"
        stroke="#2e3248" stroke-width="1" stroke-dasharray="4,3" marker-end="url(#ah-dim)" opacity="0.4"/>`;
    });
  });

  // Draw nodes on top
  pos.forEach(p => {
    const isActive = activeArrows.some(a => a.from === p.id || a.to === p.id);
    const stroke = isActive ? p.color : '#2e3248';
    const fill   = isActive ? p.color + '22' : '#1a1d27';
    const textCol = isActive ? p.color : '#4a5068';
    svg += `<rect x="${p.x}" y="${nodeY}" width="${nodeW}" height="${nodeH}" rx="7"
      fill="${fill}" stroke="${stroke}" stroke-width="${isActive ? 2 : 1.5}"/>`;
    svg += `<text x="${p.cx}" y="${nodeY + nodeH / 2 + 4}" text-anchor="middle"
      fill="${textCol}" font-size="11" font-weight="700" font-family="sans-serif">${p.label}</text>`;
  });

  svg += '</svg>';
  return `<div class="flow-progress-wrap">
    <div class="section-title">Where you are in the flow</div>
    ${svg}
  </div>`;
};
