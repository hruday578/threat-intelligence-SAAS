/**
 * AertEM Unified Search Planner
 * 
 * Takes:
 * - Company profile and domain
 * - Accepted company threats
 * - Saved locations and their accepted threats
 * - Saved vendors and their accepted threats
 * - User-selected concepts, sources, duration, sorting
 * 
 * Generates:
 * - Deterministic, provider-compliant search queries for Event Registry / NewsAPI.ai
 * - Query provenance tracking (which company, location, or vendor generated each sub-query)
 * - Avoids giant unmanageable OR combinations by partitioning into targeted sub-queries
 */

import { HAZARD_CONCEPT_URIS } from '../data/hazardConcepts.js';

export function buildUnifiedSearchPlan({
  profile = {},
  locations = [],
  vendors = [],
  userConcepts = [],
  userSources = [],
  duration = '30d',
  sortBy = 'date',
  radius = 0,
  targetZones = ''
}) {
  const queryProvenance = [];
  const planQueries = [];

  // 1. Gather all accepted threat terms across Company, Locations, and Vendors
  const companyThreats = Array.isArray(profile.target_hazards) ? profile.target_hazards : [];
  
  // Location specific threats
  const locationThreats = locations.flatMap(loc => 
    (Array.isArray(loc.accepted_threats) ? loc.accepted_threats : []).map(t => ({
      threat: t,
      entity: `Location: ${loc.city || loc.country} (${loc.location_type || 'Site'})`,
      location: loc.city || loc.country,
      criticality: loc.criticality
    }))
  );

  // Vendor specific threats
  const vendorThreats = vendors.flatMap(v =>
    (Array.isArray(v.accepted_threats) ? v.accepted_threats : []).map(t => ({
      threat: t,
      entity: `Vendor: ${v.vendor_name} (${[v.vendor_city, v.vendor_country].filter(Boolean).join(', ')})`,
      location: v.vendor_city || v.vendor_country,
      dependency: v.dependency_level
    }))
  );

  // 2. Map hazards to provenance
  companyThreats.forEach(th => {
    queryProvenance.push({
      threat: th,
      sourceType: 'COMPANY',
      sourceName: profile.company_name || 'Primary Company',
      domain: profile.company_domain || ''
    });
  });

  locationThreats.forEach(lt => {
    queryProvenance.push({
      threat: lt.threat,
      sourceType: 'LOCATION',
      sourceName: lt.entity,
      location: lt.location
    });
  });

  vendorThreats.forEach(vt => {
    queryProvenance.push({
      threat: vt.threat,
      sourceType: 'VENDOR',
      sourceName: vt.entity,
      location: vt.location
    });
  });

  // Calculate Date bounds
  const days = duration === '1h' ? 0.04 : duration === '24h' ? 1 : duration === '7d' ? 7 : 30;
  const dateStart = new Date(Date.now() - days * 86400000).toISOString().split('T')[0];
  const dateEnd = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  // Compile unique hazard keywords (capped to prevent 15-keyword API limits)
  const allUniqueHazards = Array.from(new Set([
    ...companyThreats,
    ...locationThreats.map(l => l.threat),
    ...vendorThreats.map(v => v.threat)
  ])).filter(Boolean);

  // Fallback if no specific hazards selected
  const activeHazards = allUniqueHazards.length > 0 ? allUniqueHazards : ['Cyber Attack', 'Natural Disaster', 'Supply Chain Disruption'];

  // Map to keyword and conceptUri objects
  const keywordConditions = activeHazards.slice(0, 8).map(kw => {
    const normalized = kw.toLowerCase().trim();
    const conceptUri = HAZARD_CONCEPT_URIS?.[normalized];
    return conceptUri ? { conceptUri } : { keyword: kw };
  });

  // Locations / Geographies
  const distinctCountries = Array.from(new Set([
    profile.hq_country,
    ...locations.map(l => l.country),
    ...vendors.map(v => v.vendor_country)
  ])).filter(Boolean);

  const distinctCities = Array.from(new Set([
    profile.hq_city,
    ...locations.map(l => l.city),
    ...vendors.map(v => v.vendor_city)
  ])).filter(Boolean);

  // Build Primary Query Bundle
  const baseConditions = [{ dateStart, dateEnd }];

  if (keywordConditions.length === 1) {
    baseConditions.push(keywordConditions[0]);
  } else if (keywordConditions.length > 1) {
    baseConditions.push({ "$or": keywordConditions });
  }

  // Location filter conditions
  const locationConditions = [];
  distinctCountries.slice(0, 5).forEach(cName => {
    const cleanName = (cName === 'United States of America' || cName === 'USA') ? 'United States' : cName;
    const wikiUri = `http://en.wikipedia.org/wiki/${encodeURIComponent(cleanName.replace(/ /g, '_'))}`;
    locationConditions.push({ conceptUri: wikiUri });
  });

  if (locationConditions.length === 1) {
    baseConditions.push(locationConditions[0]);
  } else if (locationConditions.length > 1) {
    baseConditions.push({ "$or": locationConditions });
  }

  planQueries.push({
    id: 'query_primary_unified',
    target: 'PRIMARY',
    queryParts: baseConditions,
    provenanceCount: queryProvenance.length
  });

  // Vendor / Partner supply-chain targeted query if single-source vendors exist
  const singleSourceVendors = vendors.filter(v => v.single_source && v.vendor_name);
  if (singleSourceVendors.length > 0) {
    const vendorConditions = singleSourceVendors.slice(0, 3).map(v => ({ keyword: v.vendor_name }));
    planQueries.push({
      id: 'query_single_source_vendors',
      target: 'VENDORS',
      queryParts: [
        { dateStart, dateEnd },
        { "$or": vendorConditions }
      ],
      provenanceCount: singleSourceVendors.length
    });
  }

  return {
    planId: `plan_${Date.now()}`,
    dateRange: { dateStart, dateEnd },
    activeHazards,
    distinctCountries,
    distinctCities,
    planQueries,
    queryProvenance,
    summary: {
      totalThreatCriteria: allUniqueHazards.length,
      locationsCovered: distinctCountries.length,
      vendorsMonitored: vendors.length,
      subQueriesCount: planQueries.length
    }
  };
}
