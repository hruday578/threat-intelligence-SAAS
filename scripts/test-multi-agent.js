/**
 * Test Suite: Multi-Agent Architecture Verification
 * Validates:
 * 1. Agent 1 (Deduplication Agent): Deterministic prune, near-duplicate preservation, candidate audit
 * 2. Agent 2 (Grouping Agent): Incident clustering across independent publishers, corroboration scoring
 * 3. Multi-Agent Pipeline Coordinator: Sequential handoff between agents
 */

import { runDeduplicationAgent } from '../src/services/deduplicationAgent.js';
import { runGroupingAgent } from '../src/services/groupingAgent.js';
import { executeMultiAgentPipeline } from '../src/services/agentPipeline.js';

let totalTests = 0;
let passedTests = 0;

function assert(condition, testName) {
  totalTests++;
  if (condition) {
    console.log(`  PASS: ${testName}`);
    passedTests++;
  } else {
    console.error(`  FAIL: ${testName}`);
  }
}

async function runTests() {
  console.log('\n=== TEST SUITE 1: Deduplication Agent (Agent 1) ===');

  const rawSample = [
    {
      uri: 'art-1',
      url: 'https://news.example.com/cyber-attack?utm_source=twitter',
      title: 'Major Ransomware Hits Supplier Logistics Hub',
      body: 'A critical ransomware incident disrupted operations across European hubs early Thursday morning.',
      source: { title: 'CyberDaily' },
      dateTime: '2026-10-28T08:00:00Z'
    },
    // Exact duplicate with tracking params stripped
    {
      uri: 'art-2',
      url: 'https://news.example.com/cyber-attack?ref=social',
      title: 'Major Ransomware Hits Supplier Logistics Hub',
      body: 'A critical ransomware incident disrupted operations across European hubs early Thursday morning.',
      source: { title: 'CyberDaily' },
      dateTime: '2026-10-28T08:05:00Z'
    },
    // Independent coverage of the same event
    {
      uri: 'art-3',
      url: 'https://reuters.com/tech/ransomware-logistics-disruption',
      title: 'Logistics Supplier Halts Shipments After Cyber Attack',
      body: 'European ports faced delays as supply chain firm took systems offline following cyber extortion attack.',
      source: { title: 'Reuters' },
      dateTime: '2026-10-28T09:30:00Z'
    },
    // Completely unrelated event
    {
      uri: 'art-4',
      url: 'https://weather.com/floods-mumbai',
      title: 'Heavy Rains Trigger Urban Flooding in Mumbai',
      body: 'Monsoon downpours overwhelmed drainage networks in Mumbai, halting suburban rail lines.',
      source: { title: 'The Hindu' },
      dateTime: '2026-10-28T10:00:00Z'
    }
  ];

  const dedupAgentResult = await runDeduplicationAgent(rawSample, { nearDuplicateThreshold: 0.82 });
  assert(dedupAgentResult.agent === 'DeduplicationAgent', 'Identifies as DeduplicationAgent');
  assert(dedupAgentResult.uniqueArticles.length === 3, 'Retained exactly 3 unique articles out of 4');
  assert(dedupAgentResult.exactDuplicates.length === 1, 'Pruned 1 exact duplicate article');
  assert(dedupAgentResult.duplicateAuditRecords.length === 1, 'Maintains duplicate audit trail with source provenance');

  console.log('\n=== TEST SUITE 2: Grouping & Correlation Agent (Agent 2) ===');

  const classifiedSample = [
    {
      uri: 'art-1',
      title: 'Major Ransomware Hits Supplier Logistics Hub',
      source: { title: 'CyberDaily' },
      dateTime: '2026-10-28T08:00:00Z',
      ai: {
        hazard: 'Ransomware',
        classification: 'ALERT',
        severity: 'HIGH',
        region: 'Europe',
        locations: ['Europe']
      }
    },
    {
      uri: 'art-3',
      title: 'Logistics Supplier Halts Shipments After Cyber Attack',
      source: { title: 'Reuters' },
      dateTime: '2026-10-28T09:30:00Z',
      ai: {
        hazard: 'Ransomware',
        classification: 'ALERT',
        severity: 'HIGH',
        region: 'Europe',
        locations: ['Europe']
      }
    },
    {
      uri: 'art-4',
      title: 'Heavy Rains Trigger Urban Flooding in Mumbai',
      source: { title: 'The Hindu' },
      dateTime: '2026-10-28T10:00:00Z',
      ai: {
        hazard: 'Flood',
        classification: 'WARNING',
        severity: 'MED',
        region: 'Mumbai',
        locations: ['Mumbai, India']
      }
    }
  ];

  const groupingResult = await runGroupingAgent(classifiedSample);
  assert(groupingResult.agent === 'GroupingAgent', 'Identifies as GroupingAgent');
  assert(groupingResult.groupedEventCount === 2, 'Correlated 3 articles into 2 distinct incident groups');

  const ransomwareIncident = groupingResult.events.find(e => e.hazard.toLowerCase().includes('ransomware'));
  assert(ransomwareIncident !== undefined, 'Found ransomware incident group');
  assert(ransomwareIncident.articles.length === 2, 'Group contains both distinct reporting articles');
  assert(ransomwareIncident.corroborationLevel === 'CORROBORATED', 'Calculated CORROBORATED level (2 distinct publishers: CyberDaily + Reuters)');
  assert(ransomwareIncident.distinctPublishers.length === 2, 'Tracked 2 distinct publishers');

  const floodIncident = groupingResult.events.find(e => e.hazard.toLowerCase().includes('flood'));
  assert(floodIncident.corroborationLevel === 'SINGLE_SOURCE', 'Flood incident marked as SINGLE_SOURCE');

  console.log('\n=== TEST SUITE 3: Multi-Agent Coordinator Integration ===');

  const pipelineOutput = await executeMultiAgentPipeline(rawSample, {
    nearDuplicateThreshold: 0.82
  });

  assert(pipelineOutput.success === true, 'Multi-agent pipeline executed successfully');
  assert(pipelineOutput.timeline.length >= 3, 'Multi-agent pipeline produced audit timeline');
  assert(pipelineOutput.deduplication.exactDuplicates.length === 1, 'Pipeline executed Agent 1 deduplication');
  assert(pipelineOutput.grouping.events.length > 0, 'Pipeline executed Agent 2 incident grouping');

  console.log('\n========================================');
  console.log(`TOTAL AGENT TESTS: ${totalTests}`);
  console.log(`PASSED: ${passedTests}`);
  console.log(`FAILED: ${totalTests - passedTests}`);
  console.log('========================================\n');

  if (totalTests !== passedTests) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
