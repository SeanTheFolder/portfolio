// js/data.js — Static data constants for Sean Welding portfolio.
// Loaded before main.js so main.js can reference these globals.

const rdrLabels = [
  'Microsoft Security',
  'Compliance & Gov',
  'Network & Infra',
  'Endpoint & Cloud',
  'Digital Transform',
  'AI & Automation',
  'Strategic Leadership',
  'Healthcare IT',
  'Physical Security'
];

const rdrScores = [96, 97, 90, 91, 86, 85, 92, 97, 88];

const skillData = [
  {
    title: 'Microsoft Security',
    skills: [
      { n: 'Sentinel (SIEM/SOAR)', p: 96 },
      { n: 'Defender Suite', p: 94 },
      { n: 'Purview (DLP/Compliance)', p: 93 },
      { n: 'Entra ID & Conditional Access', p: 92 },
      { n: 'Intune', p: 94 }
    ]
  },
  {
    title: 'AI & Automation',
    skills: [
      { n: 'Microsoft Copilot', p: 85 },
      { n: 'Copilot Studio / Agents', p: 83 },
      { n: 'Security Copilot', p: 82 },
      { n: 'Power Automate / Logic Apps', p: 88 },
      { n: 'AI Governance & DLP', p: 86 }
    ]
  },
  {
    title: 'Compliance & Governance',
    skills: [
      { n: 'HIPAA Security & Privacy Rule', p: 97 },
      { n: 'HITECH Act & Breach Notification', p: 95 },
      { n: 'CIS Controls v8 (HIPAA Crosswalk)', p: 94 },
      { n: 'HITRUST CSF Framework', p: 88 },
      { n: 'Risk Analysis & Audit Readiness', p: 96 },
      { n: 'OIG Compliance Program Guidance', p: 87 },
      { n: 'Policy & Procedure Development', p: 93 }
    ]
  },
  {
    title: 'Strategy & Operations',
    skills: [
      { n: 'Board Reporting', p: 93 },
      { n: 'Budget Management', p: 91 },
      { n: 'ITIL Service Mgmt', p: 90 },
      { n: 'Agile / Scrum', p: 88 },
      { n: 'Vendor Negotiation', p: 89 }
    ]
  },
  {
    title: 'Infrastructure & Endpoint',
    skills: [
      { n: 'Autopilot / Intune / SCCM', p: 91 },
      { n: 'Defender for Cloud', p: 90 },
      { n: 'Azure Log Analytics', p: 89 },
      { n: 'Microsoft Backup / AWS S3', p: 86 },
      { n: 'WatchGuard / Ubiquiti / Aruba', p: 92 }
    ]
  }
];
