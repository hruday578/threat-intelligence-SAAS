/**
 * Deduplication AI Agent (Agent 1)
 *
 * Specializes in identifying wire-service reprints, syndications, and near-duplicate articles.
 * Combines fast deterministic canonicalization and hashing with AI semantic verification
 * for borderline candidate pairs (similarity around the 0.82 threshold).
 */

import { canonicalizeUrl, computeTextHash, deduplicateArticles } from './deduplication.js';

export const DEDUP_AGENT_SYSTEM_PROMPT = `[ROLE: THREAT INTELLIGENCE DEDUPLICATION AGENT]
You are a specialized Deduplication Agent for a real-time Threat Intelligence platform.
Your objective is to examine candidate pairs of news articles and determine whether Article B is a duplicate/syndication of Article A or a distinct operational event.

Rules:
1. Exact or near-identical text (wire syndications, AP/Reuters reprints, press releases with minor editorial changes) must be marked as DUPLICATE.
2. Distinct incidents even in the same city/region (e.g. two separate traffic accidents, or a cyber attack vs a flood) must be marked as DISTINCT.
3. Subsequent updates that introduce significant new material facts (e.g. casualty escalation, root-cause attribution) must be marked as DISTINCT_UPDATE.

Return ONLY a valid JSON object matching this schema:
{
  "verdict": "DUPLICATE | DISTINCT | DISTINCT_UPDATE",
  "confidence": 0-100,
  "similarityScore": 0.0-1.0,
  "reasoning": "Concise factual reason for the verdict"
}`;

/**
 * Runs the Deduplication Agent on a batch of raw ingested articles.
 * Performs fast deterministic filtering first, and optionally invokes LLM verification for borderline near-duplicates.
 */
export async function runDeduplicationAgent(rawArticles = [], options = {}) {
  const {
    nearDuplicateThreshold = 0.82,
    enableAiReview = false,
    apiKey = '',
    provider = 'groq',
    fetchFn = fetch
  } = options;

  // Step 1: Run the deterministic conservative deduplication engine
  const baseResult = deduplicateArticles(rawArticles, { nearDuplicateThreshold });

  const aiReviewedCandidates = [];

  // Step 2: If AI review is enabled and there are borderline near-duplicate candidates, run Agent 1
  if (enableAiReview && baseResult.nearDuplicateCandidates.length > 0 && apiKey) {
    for (const candidate of baseResult.nearDuplicateCandidates.slice(0, 10)) { // bounded check
      try {
        const response = await fetchFn('/api/ai-proxy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            provider,
            apiKey,
            model: 'openai/gpt-oss-120b',
            temperature: 0.0,
            messages: [
              { role: 'system', content: DEDUP_AGENT_SYSTEM_PROMPT },
              {
                role: 'user',
                content: JSON.stringify({
                  articleA: { title: candidate.canonicalArticle?.title, body: (candidate.canonicalArticle?.body || '').slice(0, 500) },
                  articleB: { title: candidate.candidateArticle?.title, body: (candidate.candidateArticle?.body || '').slice(0, 500) },
                  jaccardSimilarity: candidate.similarityScore
                })
              }
            ]
          })
        });

        if (response.ok) {
          const data = await response.json();
          const content = data?.choices?.[0]?.message?.content || '{}';
          const cleaned = content.replace(/```json|```/g, '').trim();
          const parsed = JSON.parse(cleaned);
          aiReviewedCandidates.push({
            ...candidate,
            aiVerdict: parsed.verdict,
            aiConfidence: parsed.confidence,
            aiReasoning: parsed.reasoning
          });
        }
      } catch (err) {
        console.warn('[DeduplicationAgent] AI verification skipped for candidate:', err.message);
      }
    }
  }

  return {
    agent: 'DeduplicationAgent',
    version: '1.0.0',
    stats: {
      ...baseResult.stats,
      aiReviewedCount: aiReviewedCandidates.length
    },
    uniqueArticles: baseResult.uniqueArticles,
    exactDuplicates: baseResult.exactDuplicates,
    nearDuplicateCandidates: baseResult.nearDuplicateCandidates,
    aiReviewedCandidates,
    duplicateAuditRecords: baseResult.duplicateAuditRecords
  };
}
