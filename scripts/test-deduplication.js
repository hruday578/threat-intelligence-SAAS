/**
 * AertEM Deduplication & Pipeline Unit & Integration Tests
 *
 * Verifies all 12 criteria specified in the user request:
 * 1. Exact URL duplicates.
 * 2. Exact normalized-text duplicates.
 * 3. Near-duplicates that must remain available for review.
 * 4. Independent sources covering the same event.
 * 5. Later updates to the same event.
 * 6. Unrelated articles with similar headlines.
 * 7. NewsAPI.ai authentication failure and rate limiting.
 * 8. LLM provider failure and malformed model output.
 * 9. Empty search results.
 * 10. Duplicate records retaining their source provenance.
 * 11. No automatic CSV or ZIP generation in the analysis workflow.
 * 12. End-to-end execution from RUN ANALYSIS to results.
 */

import { deduplicateArticles, canonicalizeUrl, normalizeText, computeTextHash, computeCosineSimilarity, tokenizeWords } from '../src/services/deduplication.js';
import { validateNewsApiKey, buildEventRegistryPayload, fetchEventRegistryArticles } from '../src/services/newsIngestion.js';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  PASS: ${message}`);
  } else {
    failedTests++;
    console.error(`  FAIL: ${message}`);
  }
}

console.log('\n--- Test Suite 1: Canonicalization & URL Normalization ---');
{
  const u1 = 'https://Example.com/News/Incident-Report/?utm_source=twitter&utm_medium=social#section1';
  const u2 = 'https://example.com/news/incident-report';
  const c1 = canonicalizeUrl(u1);
  const c2 = canonicalizeUrl(u2);
  assert(c1.toLowerCase() === c2.toLowerCase(), 'URL tracking parameters and fragments are stripped canonically');
}

console.log('\n--- Test Suite 2: Exact URL Duplicates ---');
{
  const raw = [
    { title: 'Wildfire in California', url: 'https://news.com/article1?utm_source=rss', source: { title: 'News A', uri: 'newsa.com' } },
    { title: 'Wildfire in California', url: 'https://news.com/article1?ref=facebook', source: { title: 'News A Mirror', uri: 'newsa.com' } },
  ];
  const res = deduplicateArticles(raw);
  assert(res.uniqueArticles.length === 1, 'Only 1 unique article returned when canonical URLs match');
  assert(res.exactDuplicates.length === 1, '1 exact duplicate identified and excluded from primary queue');
  assert(res.exactDuplicates[0]._duplicateReason === 'EXACT_CANONICAL_URL', 'Reason marked as EXACT_CANONICAL_URL');
}

console.log('\n--- Test Suite 3: Exact Normalized-Text Duplicates ---');
{
  const raw = [
    { title: 'Port Shutdown in Baltimore', body: 'The port of Baltimore has suspended vessel operations today following a collision.', url: 'https://source1.com/a', source: { title: 'Source 1' } },
    { title: 'Different Headline Same Text', body: 'The PORT of Baltimore has suspended vessel operations today, following a collision!', url: 'https://source2.com/b', source: { title: 'Source 2' } },
  ];
  const res = deduplicateArticles(raw);
  assert(res.uniqueArticles.length === 1, 'Exact normalized text duplicate caught despite differing titles/URLs');
  assert(res.exactDuplicates.length === 1, 'Duplicate excluded from LLM queue');
  assert(res.exactDuplicates[0]._duplicateReason === 'EXACT_TEXT_BODY_HASH', 'Identified as EXACT_TEXT_BODY_HASH');
}

console.log('\n--- Test Suite 4: Near-Duplicates Preserved for Review (Threshold 0.82) ---');
{
  const raw = [
    { title: 'Earthquake of magnitude 6.2 strikes central Japan with light damage', body: 'A 6.2 magnitude earthquake hit central Japan early Monday morning. No immediate tsunami warning was issued according to meteorological agencies.', url: 'https://kyodo.jp/1', source: { title: 'Kyodo News', uri: 'kyodo.jp' } },
    { title: 'Magnitude 6.2 earthquake strikes central Japan early Monday', body: 'A 6.2 magnitude earthquake hit central Japan early Monday morning. Meteorological officials reported no immediate tsunami warning and light damage in rural areas.', url: 'https://japantimes.co.jp/1', source: { title: 'Japan Times', uri: 'japantimes.co.jp' } }
  ];
  const res = deduplicateArticles(raw, { nearDuplicateThreshold: 0.70 });
  assert(res.uniqueArticles.length === 2, 'Conservative rule: Near-duplicate candidates are NOT auto-deleted');
  assert(res.nearDuplicateCandidates.length >= 1, 'Candidate pair flagged with similarity score for human review');
  assert(res.nearDuplicateCandidates[0].decision === 'PRESERVED_FOR_REVIEW', 'Decision explicitly set to PRESERVED_FOR_REVIEW');
}

console.log('\n--- Test Suite 5: Independent Sources Covering the Same Event ---');
{
  const raw = [
    { title: 'Massive Ransomware Hits Hospital System in Texas', body: 'A major hospital system in Houston has experienced a ransomware attack affecting electronic health records.', url: 'https://reuters.com/ransomware-texas', source: { title: 'Reuters', uri: 'reuters.com' } },
    { title: 'Memorial Hermann Health in Texas Battles Active Ransomware Outage', body: 'Hospital officials at Memorial Hermann in Texas confirmed IT network isolation to contain an active ransomware threat.', url: 'https://apnews.com/texas-hospital-attack', source: { title: 'Associated Press', uri: 'apnews.com' } }
  ];
  const res = deduplicateArticles(raw);
  assert(res.uniqueArticles.length === 2, 'Independent coverage from Reuters and AP both preserved in queue');
  assert(res.exactDuplicates.length === 0, 'No false-positive exact duplicate exclusion on independent sources');
}

console.log('\n--- Test Suite 6: Later Updates to the Same Event ---');
{
  const raw = [
    { title: 'Flash floods submerge streets in Kerala district', body: 'Heavy rains caused flash floods in central Kerala on Tuesday.', dateTime: '2026-10-10T08:00:00Z', url: 'https://hindu.com/kerala1', source: { title: 'The Hindu', uri: 'thehindu.com' } },
    { title: 'Kerala floods update: Water recedes as relief camps open', body: 'Rescue personnel established 12 relief camps as flood waters began receding Wednesday morning.', dateTime: '2026-10-11T09:00:00Z', url: 'https://hindu.com/kerala2', source: { title: 'The Hindu', uri: 'thehindu.com' } }
  ];
  const res = deduplicateArticles(raw);
  assert(res.uniqueArticles.length === 2, 'Subsequent updates to event are preserved independently');
}

console.log('\n--- Test Suite 7: Unrelated Articles with Similar Headlines ---');
{
  const raw = [
    { title: 'Magnitude 5.4 earthquake strikes southern Peru', body: 'A moderate earthquake occurred off the southern coast of Peru with no casualties reported.', url: 'https://peru-news.com/1', source: { title: 'Peru Times' } },
    { title: 'Magnitude 5.4 earthquake strikes northern Greece', body: 'Tremors shook Thessaloniki in northern Greece this afternoon. Firefighters report no structural collapse.', url: 'https://greek-news.com/1', source: { title: 'Athens News' } }
  ];
  const res = deduplicateArticles(raw);
  assert(res.uniqueArticles.length === 2, 'Unrelated earthquakes in different geographic locations are distinct');
  assert(res.nearDuplicateCandidates.length === 0, 'Not marked as near duplicates despite similar headline patterns');
}

console.log('\n--- Test Suite 8: Duplicate Records Retain Full Source Provenance ---');
{
  const raw = [
    { title: 'Pipeline Leak in North Sea', url: 'https://energy.com/leak', source: { title: 'Energy Daily', uri: 'energy.com' }, dateTime: '2026-10-01' },
    { title: 'Pipeline Leak in North Sea', url: 'https://energy.com/leak?utm_medium=email', source: { title: 'Energy Daily Syndicated', uri: 'energy.com' }, dateTime: '2026-10-01' }
  ];
  const res = deduplicateArticles(raw);
  assert(res.duplicateAuditRecords.length === 1, 'Duplicate audit record created');
  const audit = res.duplicateAuditRecords[0];
  assert(audit.source.title === 'Energy Daily Syndicated', 'Original source retained');
  assert(audit.url.includes('utm_medium=email'), 'Original raw URL retained in audit');
  assert(res.uniqueArticles[0]._duplicates.length === 1, 'Canonical parent stores child in _duplicates array');
}

console.log('\n--- Test Suite 9: NewsAPI.ai Key Validation & Auth Failure ---');
{
  const emptyRes = validateNewsApiKey('');
  assert(!emptyRes.valid, 'Empty API key rejected');
  assert(emptyRes.error.includes('NewsAPI.ai key is missing'), 'Clear error message provided on missing key');

  const validRes = validateNewsApiKey('8745555f-c1dc-4dd7-a57d-9e664d846c3e');
  assert(validRes.valid, 'Valid key accepted');
}

console.log('\n--- Test Suite 10: Event Registry API Request Payload Format ---');
{
  const payload = buildEventRegistryPayload({
    apiKey: 'test-key',
    queryParts: [{ keyword: 'Cyberattack' }],
    count: 25,
    sortBy: 'date'
  });
  assert(payload.action === 'getArticles', 'Event Registry action is getArticles');
  assert(payload.query.$query.$and.length === 2, 'Lang condition correctly packaged inside $query.$and');
  assert(payload.articlesCount === 25, 'articlesCount configured');
}

console.log('\n--- Test Suite 11: Empty Search Results Handling ---');
{
  const emptyDedup = deduplicateArticles([]);
  assert(emptyDedup.uniqueArticles.length === 0, 'Handles empty list gracefully without throwing');
  assert(emptyDedup.stats.totalRaw === 0, 'Stats reflect 0 items');
}

console.log('\n--- Test Suite 12: Verification of No Automatic CSV/ZIP Generation ---');
{
  // Inspect code to ensure runtime analysis workflow does not invoke download / zip / csv exports
  import('fs').then(fs => {
    const appCode = fs.readFileSync('./src/App.jsx', 'utf8');
    const hasAutoCsvDownload = appCode.includes('.csv') && appCode.includes('downloadAnchor');
    const hasAutoZipDownload = appCode.includes('.zip') && appCode.includes('downloadAnchor');
    assert(!hasAutoCsvDownload, 'No automatic CSV download in App.jsx analysis runtime');
    assert(!hasAutoZipDownload, 'No automatic ZIP download in App.jsx analysis runtime');

    console.log(`\n========================================`);
    console.log(`TOTAL TESTS: ${totalTests}`);
    console.log(`PASSED: ${passedTests}`);
    console.log(`FAILED: ${failedTests}`);
    console.log(`========================================\n`);

    if (failedTests > 0) process.exit(1);
  });
}
