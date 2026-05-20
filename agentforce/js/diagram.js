/* ── Agentforce module — Mermaid rendering, tabs, collapsible steps ── */

const DIAGRAM_SOURCE = `flowchart TD
    USER([User Message]) --> CH

    subgraph CH["Channels"]
      WEB[Web Chat] & MSG[Messaging] & SLK[Slack] & VOC[Voice]
    end

    CH --> RE

    subgraph RE["Reasoning Engine"]
      direction TB
      CLS[1 - Classification - Match to Subagent] --> CTX
      CTX[2 - Context Assembly - Script and Instructions and Actions] --> DET
      DET[3 - Deterministic Logic - Agentforce Script] --> LLM_D
      LLM_D[4 - LLM Decision - Probabilistic Reasoning] --> ACT_E
      ACT_E[5 - Action Execution] --> GRD
      GRD[6 - Grounding Check] --> RESP
    end

    RE --> RESP([Final Response])

    subgraph SA["Subagents"]
      S1[Subagent A] & S2[Subagent B] & S3[Subagent C]
    end

    subgraph ACTIONS["Actions"]
      FL[Flows] & AP[Apex] & PT[Prompt Templates] & API[MuleSoft - APIs]
    end

    subgraph RAG["RAG - Data and Context"]
      ADL[Data Libraries - ADL] --> RTV[Retrievers]
      RTV --> LLM_D
    end

    subgraph SF["Salesforce Platform"]
      CRM[(CRM Data)] & KB[(Knowledge Base)] & ETL[Einstein Trust Layer]
    end

    CLS --> SA
    SA --> CTX
    LLM_D --> ACTIONS
    ACTIONS --> SF
    ETL -.-> RE`;

const DARK_VARS = {
  primaryColor: '#1e3a5f',
  primaryTextColor: '#e2e8f0',
  primaryBorderColor: '#00a1e0',
  lineColor: '#00a1e0',
  secondaryColor: '#0d1424',
  tertiaryColor: '#0a0f1e',
  background: '#0a0f1e',
  mainBkg: '#0d1424',
  nodeBorder: '#00a1e0',
  clusterBkg: '#0d1424',
  titleColor: '#e2e8f0',
  edgeLabelBackground: '#0d1424',
};

const LIGHT_VARS = {
  primaryColor: '#dbeafe',
  primaryTextColor: '#0f172a',
  primaryBorderColor: '#0369a1',
  lineColor: '#0369a1',
  secondaryColor: '#f0f9ff',
  tertiaryColor: '#f0f4f8',
  background: '#f0f4f8',
  mainBkg: '#ffffff',
  nodeBorder: '#0369a1',
  clusterBkg: '#f0f9ff',
  titleColor: '#0f172a',
  edgeLabelBackground: '#ffffff',
};

function getMermaidTheme() {
  return document.documentElement.getAttribute('data-theme') === 'light' ? 'default' : 'dark';
}

function getMermaidVars() {
  return document.documentElement.getAttribute('data-theme') === 'light' ? LIGHT_VARS : DARK_VARS;
}

async function renderMermaid() {
  const container = document.getElementById('mermaid-diagram');
  if (!container) return;
  container.removeAttribute('data-processed');
  container.innerHTML = DIAGRAM_SOURCE;

  mermaid.initialize({
    startOnLoad: false,
    theme: getMermaidTheme(),
    themeVariables: getMermaidVars(),
  });

  await mermaid.run({ nodes: [container] });
}

/* ── TAB SWITCHING ── */
function switchTab(tabId, btn) {
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-' + tabId).classList.add('active');
  btn.classList.add('active');
  if (tabId === 'concepts') setTimeout(renderMermaid, 50);
}
window.switchTab = switchTab;

/* ── INIT ── */
document.addEventListener('DOMContentLoaded', function () {
  renderMermaid();

  /* Re-render Mermaid when theme is toggled via the shared theme system */
  const observer = new MutationObserver(() => renderMermaid());
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
});
