/**
 * AertEM Unified Threat Taxonomy
 * Version: 2.0
 * 
 * Provides consistent, versioned categories and hazards across:
 * - Threat Recommendations (Company, Location, Vendor, IT)
 * - Unified Search Planning
 * - Per-article LLM Classification
 * - Filtering and Intel Ledger UI
 */

export const TAXONOMY_VERSION = '2.0.0';

export const THREAT_DOMAINS = {
  NATURAL_DISASTER: {
    id: 'natural_disasters_weather',
    label: 'Natural Disasters & Severe Weather',
    hazards: [
      'Earthquake', 'Flood', 'Wildfire', 'Hurricane', 'Cyclone', 'Typhoon',
      'Tornado', 'Heatwave', 'Tsunami', 'Landslide', 'Drought', 'Blizzard',
      'Volcanic Eruption', 'Severe Weather', 'Monsoon'
    ]
  },
  CYBERSECURITY: {
    id: 'cybersecurity',
    label: 'Cybersecurity & Data Protection',
    hazards: [
      'Cyber Attack', 'Ransomware', 'Data Breach', 'Phishing', 'Malware',
      'Zero-Day Vulnerability', 'DDoS Attack', 'Cloud Compromise', 'Supply Chain Hack'
    ]
  },
  GEOPOLITICAL: {
    id: 'geopolitical_conflict_civil_unrest',
    label: 'Geopolitical Conflict & Civil Unrest',
    hazards: [
      'War', 'Armed Conflict', 'Airstrike', 'Missile Strike', 'Terrorism',
      'Civil Unrest', 'Riot', 'Protest', 'Coup', 'Sanctions', 'Border Escalation'
    ]
  },
  INFRASTRUCTURE: {
    id: 'infrastructure_industrial_incidents',
    label: 'Physical, Industrial & Infrastructure Disruption',
    hazards: [
      'Power Outage', 'Blackout', 'Pipeline Leak', 'Refinery Explosion',
      'Industrial Fire', 'Train Derailment', 'Port Shutdown', 'Aviation Accident',
      'Internet / Telecom Outage', 'Structural Collapse', 'Chemical Spill'
    ]
  },
  SUPPLY_CHAIN: {
    id: 'supply_chain_transport_disruption',
    label: 'Supply Chain & Transport Disruption',
    hazards: [
      'Supply Chain Disruption', 'Shipping Delays', 'Port Closure', 'Freight Disruption',
      'Export Restrictions', 'Component Shortage', 'Single-Source Bottleneck', 'Rail Strike'
    ]
  }
};

export const ALL_HAZARDS = Object.values(THREAT_DOMAINS).flatMap(d => d.hazards);

/**
 * Extracts a concise, high-precision search keyword (1-3 words) from complex or narrative threat strings
 * Suitable for NewsAPI / EventRegistry querying
 */
export function extractCleanKeyword(threatStr) {
  if (!threatStr || typeof threatStr !== 'string') return '';
  const trimmed = threatStr.trim();

  // 1. Direct match with canonical taxonomy
  const lower = trimmed.toLowerCase();
  for (const hazard of ALL_HAZARDS) {
    if (lower === hazard.toLowerCase()) return hazard;
  }

  // 2. Substring match with canonical taxonomy
  for (const hazard of ALL_HAZARDS) {
    const hLow = hazard.toLowerCase();
    // Match word boundaries so 'war' doesn't match 'hardware'
    const regex = new RegExp(`\\b${hLow}\\b`, 'i');
    if (regex.test(trimmed)) {
      return hazard;
    }
  }

  // 3. Common domain-specific threat patterns
  if (/mfa\s+fatigue|phishing/i.test(trimmed)) return 'Phishing';
  if (/sanction/i.test(trimmed)) return 'Sanctions';
  if (/semiconductor|chip\s+shortage|component\s+shortage/i.test(trimmed)) return 'Component Shortage';
  if (/ransomware/i.test(trimmed)) return 'Ransomware';
  if (/data\s*center\s*(outage|fire)/i.test(trimmed)) return 'Power Outage';
  if (/cloud\s*(breach|outage|compromise)/i.test(trimmed)) return 'Cloud Compromise';
  if (/supply\s+chain/i.test(trimmed)) return 'Supply Chain Disruption';
  if (/power\s+(outage|grid|blackout)/i.test(trimmed)) return 'Power Outage';

  // 4. Strip parentheticals and qualifiers
  let cleaned = trimmed.replace(/\([^)]*\)/g, '').trim();
  cleaned = cleaned.replace(/^(e\.g\.|threat\s+to|risk\s+of)\s+/i, '');
  cleaned = cleaned.replace(/^(severe|critical|escalating|regional)\s+/i, '');

  // Keep first 2-3 words if still very long
  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length > 3) {
    return words.slice(0, 3).join(' ');
  }
  return cleaned || trimmed;
}

