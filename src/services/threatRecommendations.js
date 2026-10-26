/**
 * AertEM Threat Recommendation Service
 * 
 * Generates evidence-backed, schema-validated threat suggestions for:
 * 1. Company level (based on company profile, domain context, industry, scale)
 * 2. Location level (based on facility type, operational role, geography, criticality)
 * 3. Vendor level (based on vendor goods, dependency criticality, geography, single-source)
 * 
 * Uses the existing configured LLM provider abstraction (/api/ai-proxy) with
 * schema constraints, confidence levels, rationales, and fallback capability.
 */

import { THREAT_DOMAINS, ALL_HAZARDS, extractCleanKeyword } from './threatTaxonomy.js';

/**
 * Validates domain format
 */
export function isValidDomain(domain) {
  if (!domain || typeof domain !== 'string') return false;
  const clean = domain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  const domainRegex = /^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,10}$/;
  return domainRegex.test(clean);
}

/**
 * Extracts public contextual attributes from domain name
 */
export function extractDomainContext(domain) {
  if (!isValidDomain(domain)) return null;
  const clean = domain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  const parts = clean.split('.');
  const baseName = parts.length > 2 ? parts[parts.length - 2] : parts[0];
  const tld = parts[parts.length - 1];

  let inferredType = 'Commercial';
  if (tld === 'gov' || tld === 'mil') inferredType = 'Government / Military';
  else if (tld === 'edu' || tld === 'ac') inferredType = 'Academic / Research';
  else if (tld === 'org') inferredType = 'Non-Profit / Global Entity';

  return {
    domain: clean,
    brandName: baseName.charAt(0).toUpperCase() + baseName.slice(1),
    tld,
    inferredType
  };
}

/**
 * Builds schema-constrained recommendation prompt for the LLM
 */
function buildRecommendationPrompt({ entityType, entityData }) {
  const categoriesList = Object.values(THREAT_DOMAINS).map(d => `- ${d.label} (${d.hazards.join(', ')})`).join('\n');

  return `[ROLE: PRINCIPAL THREAT INTELLIGENCE ANALYST - THREAT RECOMMENDATION ENGINE]
You are tasked with generating evidence-backed, plausible operational threat suggestions for an organization or supply-chain node.

TAXONOMY DOMAINS:
${categoriesList}

ENTITY EVALUATED:
Type: ${entityType}
Data:
${JSON.stringify(entityData, null, 2)}

REQUIREMENTS:
1. Generate between 5 and 8 targeted, highly relevant, comprehensive threat suggestions across diverse threat domains.
2. Every suggestion must be rooted in the entity's actual geography, industry, facility type, dependency level, or digital footprint.
3. specificThreat MUST be a short, concise canonical hazard or threat keyword (1 to 3 words, e.g. "Ransomware", "Supply Chain Disruption", "Earthquake", "Power Outage", "Phishing", "Sanctions", "Component Shortage"). Do NOT write long full sentences or narrative descriptions in "specificThreat" — put detailed narrative explanations into "rationale" and "evidence".
4. Distinguish evidence-strength / confidence (HIGH, MEDIUM, LOW) based on real-world patterns.
5. Output STRICT JSON format as an array of objects matching the schema below.
6. DO NOT invent fake incidents or claim a disaster is currently ongoing if not verified. Distinguish general exposure from an active incident.

JSON SCHEMA:
[
  {
    "threatCategory": "Natural Disasters & Severe Weather | Cybersecurity & Data Protection | Geopolitical Conflict & Civil Unrest | Physical, Industrial & Infrastructure Disruption | Supply Chain & Transport Disruption",
    "specificThreat": "Concise canonical threat name (1-3 words, e.g. Ransomware, Flood, Power Outage)",
    "rationale": "Clear 1-2 sentence operational explanation of why this entity is exposed.",
    "evidence": "Concrete contextual evidence based on location, industry, or dependency attributes.",
    "confidence": "HIGH | MEDIUM | LOW",
    "assumptions": "Key assumption or missing information note",
    "suggestedSearchTerms": ["term1", "term2"]
  }
]`;
}

/**
 * Deterministic baseline fallback generator when LLM is unavailable or offline
 */
function generateFallbackSuggestions(entityType, entityData) {
  const suggestions = [];

  if (entityType === 'COMPANY') {
    const ind = (entityData.industry || '').toLowerCase();
    suggestions.push({
      threatCategory: 'Cybersecurity & Data Protection',
      specificThreat: 'Ransomware',
      rationale: `Organizations in ${entityData.industry || 'this sector'} are prime targets for extortion and business disruption.`,
      evidence: `Industry standard risk profile for ${entityData.industry || 'enterprise'} with cloud & on-prem assets.`,
      confidence: 'HIGH',
      assumptions: 'Assumes organization maintains connected operational and customer data.',
      suggestedSearchTerms: [entityData.company_name || 'Enterprise', 'Ransomware', 'Data Breach']
    });

    if (entityData.hq_country) {
      suggestions.push({
        threatCategory: 'Physical, Industrial & Infrastructure Disruption',
        specificThreat: 'Power Outage',
        rationale: `Headquarters in ${entityData.hq_city || entityData.hq_country} faces utility grid load fluctuations.`,
        evidence: `Geographic exposure in ${entityData.hq_country}.`,
        confidence: 'MEDIUM',
        assumptions: 'Assumes continuous utility dependency for daily headquarters operations.',
        suggestedSearchTerms: [entityData.hq_city || entityData.hq_country, 'Power Outage', 'Blackout']
      });
    }

    suggestions.push({
      threatCategory: 'Supply Chain & Transport Disruption',
      specificThreat: 'Supply Chain Disruption',
      rationale: `Global operations rely on inter-regional logistics and partner continuity.`,
      evidence: `Operational scale with ${entityData.num_employees || 'distributed'} workforce.`,
      confidence: 'MEDIUM',
      assumptions: 'Assumes multi-tier delivery or vendor interactions.',
      suggestedSearchTerms: [entityData.company_name || 'Supply Chain', 'Shipping Delays', 'Logistics']
    });
  } else if (entityType === 'LOCATION') {
    const isHighCrit = entityData.criticality === 'High';
    suggestions.push({
      threatCategory: 'Natural Disasters & Severe Weather',
      specificThreat: entityData.country === 'India' ? 'Flood' : entityData.country === 'Japan' ? 'Earthquake' : 'Severe Weather',
      rationale: `Facility in ${entityData.city || entityData.country} is geographically exposed to regional climate events.`,
      evidence: `Facility type ${entityData.location_type || 'Site'} located in ${entityData.city || entityData.country}.`,
      confidence: isHighCrit ? 'HIGH' : 'MEDIUM',
      assumptions: 'Regional weather history affects ground access and staff attendance.',
      suggestedSearchTerms: [entityData.city || entityData.country, 'Flood', 'Storm', 'Severe Weather']
    });

    suggestions.push({
      threatCategory: 'Physical, Industrial & Infrastructure Disruption',
      specificThreat: entityData.location_type === 'Data Center' ? 'Power Outage' : 'Internet / Telecom Outage',
      rationale: `${entityData.location_type || 'Facility'} requires uninterrupted power and connectivity.`,
      evidence: `Headcount ${entityData.headcount || 'operational staff'} dependent on local utilities.`,
      confidence: 'HIGH',
      assumptions: 'Local municipal grid dependency without infinite backup duration.',
      suggestedSearchTerms: [entityData.city || entityData.country, 'Power Outage', 'Infrastructure Disruption']
    });
  } else if (entityType === 'VENDOR') {
    const isSingleSource = Boolean(entityData.single_source);
    suggestions.push({
      threatCategory: 'Supply Chain & Transport Disruption',
      specificThreat: isSingleSource ? 'Single-Source Bottleneck' : 'Component Shortage',
      rationale: `Dependency on ${entityData.vendor_name} (${entityData.goods?.join(', ') || 'Supplies'}) creates potential delivery delays.`,
      evidence: `${entityData.dependency_level || 'Important'} tier vendor${isSingleSource ? ' designated as single-source' : ''}.`,
      confidence: isSingleSource ? 'HIGH' : 'MEDIUM',
      assumptions: 'Shortage of critical goods will immediately impact production.',
      suggestedSearchTerms: [entityData.vendor_name, 'Shortage', 'Disruption', 'Logistics']
    });

    if (entityData.vendor_country) {
      suggestions.push({
        threatCategory: 'Geopolitical Conflict & Civil Unrest',
        specificThreat: 'Export Restrictions',
        rationale: `Vendor located in ${entityData.vendor_country} subject to trade and regional logistics disruption.`,
        evidence: `Cross-border supplier based in ${entityData.vendor_city || entityData.vendor_country}.`,
        confidence: 'MEDIUM',
        assumptions: 'International customs and bilateral trade policy volatility.',
        suggestedSearchTerms: [entityData.vendor_country, 'Sanctions', 'Export Restrictions', 'Trade']
      });
    }
  }

  return suggestions;
}

/**
 * Main service call to generate threat recommendations
 */
export async function generateThreatRecommendations({
  entityType, // 'COMPANY' | 'LOCATION' | 'VENDOR'
  entityId = 'root',
  entityData = {},
  provider = 'groq-120b',
  apiKey = '',
  fetchFn = fetch
}) {
  const prompt = buildRecommendationPrompt({ entityType, entityData });
  const modelName = provider === 'deepseek' ? 'deepseek-chat' : provider === 'openrouter' ? 'meta-llama/llama-3.3-70b-instruct:free' : 'openai/gpt-oss-120b';
  const apiProviderName = provider === 'openrouter' ? 'openrouter' : provider === 'deepseek' ? 'deepseek' : 'groq';

  let rawSuggestions = null;

  try {
    const response = await fetchFn('/api/ai-proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: apiProviderName,
        apiKey: apiKey || '',
        model: modelName,
        temperature: 0.2,
        messages: [
          { role: 'system', content: prompt },
          { role: 'user', content: `Please generate threat suggestions for this ${entityType} entity.` }
        ]
      })
    });

    if (response.ok) {
      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content || '';
      const cleanJson = content.replace(/<think>[\s\S]*?<\/think>/gi, '').replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
      const start = cleanJson.indexOf('[');
      const end = cleanJson.lastIndexOf(']');
      if (start !== -1 && end > start) {
        rawSuggestions = JSON.parse(cleanJson.slice(start, end + 1));
      }
    }
  } catch (err) {
    console.warn(`[Threat Recommendations] LLM request fallback: ${err.message}`);
  }

  if (!Array.isArray(rawSuggestions) || rawSuggestions.length === 0) {
    rawSuggestions = generateFallbackSuggestions(entityType, entityData);
  }

  // Format into consistent, auditable schema
  const timestamp = new Date().toISOString();
  return rawSuggestions.map((item, idx) => {
    const rawSpecific = item.specificThreat || 'Operational Risk';
    const cleanSpecific = extractCleanKeyword(rawSpecific) || rawSpecific;

    return {
      id: `rec_${entityType.toLowerCase()}_${entityId}_${Date.now()}_${idx}`,
      entityType,
      entityId: String(entityId),
      threatCategory: item.threatCategory || 'General',
      specificThreat: cleanSpecific,
      title: rawSpecific !== cleanSpecific ? rawSpecific : undefined,
      rationale: item.rationale || 'Identified based on entity profile and operating parameters.',
      evidence: item.evidence || 'Established from entity location, operational criticality, and domain attributes.',
      confidence: ['HIGH', 'MEDIUM', 'LOW'].includes(item.confidence) ? item.confidence : 'MEDIUM',
      assumptions: item.assumptions || 'Assumes standard industry operating exposure.',
      suggestedSearchTerms: Array.isArray(item.suggestedSearchTerms) ? item.suggestedSearchTerms : [cleanSpecific],
      status: 'suggested', // 'suggested' | 'accepted' | 'rejected' | 'edited'
      createdAt: timestamp,
      updatedAt: timestamp
    };
  });
}
