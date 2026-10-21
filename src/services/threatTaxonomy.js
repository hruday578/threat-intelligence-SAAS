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
 * Finds the canonical domain for a given hazard string
 */
export function getDomainForHazard(hazardName) {
  if (!hazardName || typeof hazardName !== 'string') return null;
  const target = hazardName.toLowerCase().trim();
  for (const domain of Object.values(THREAT_DOMAINS)) {
    if (domain.hazards.some(h => h.toLowerCase() === target || target.includes(h.toLowerCase()))) {
      return domain;
    }
  }
  return null;
}
