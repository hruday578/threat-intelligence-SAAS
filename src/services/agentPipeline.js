/**
 * Multi-Agent Pipeline Coordinator
 *
 * Coordinates the execution of dedicated AI agents:
 * - Agent 1: Deduplication Agent (URL canonicalization, hash pruning, near-duplicate review)
 * - Agent 2: Per-Article Classifier (Untrusted text isolation, taxonomy classification, severity)
 * - Agent 3: Grouping & Correlation Agent (Story clustering, corroboration score, unified timelines)
 */

import { runDeduplicationAgent } from './deduplicationAgent.js';
import { runGroupingAgent } from './groupingAgent.js';
import { classifySingleArticle } from './articleClassifier.js';

export async function executeMultiAgentPipeline(rawArticles = [], options = {}) {
  const {
    nearDuplicateThreshold = 0.82,
    enableAiDedupReview = false,
    enableAiStoryGrouping = false,
    classifyArticles = false,
    companyProfile = {},
    monitoringContext = '',
    provider = 'groq',
    apiKey = '',
    fetchFn = fetch
  } = options;

  const pipelineTimeline = [];
  const logStep = (stepName, detail) => {
    pipelineTimeline.push({
      timestamp: new Date().toISOString(),
      step: stepName,
      detail
    });
  };

  logStep('PIPELINE_START', `Received ${rawArticles.length} raw incoming articles.`);

  // ── AGENT 1: Deduplication Agent ─────────────────────────
  const dedupResult = await runDeduplicationAgent(rawArticles, {
    nearDuplicateThreshold,
    enableAiReview: enableAiDedupReview,
    apiKey,
    provider,
    fetchFn
  });

  logStep('AGENT_1_DEDUPLICATION_DONE', {
    totalRaw: rawArticles.length,
    uniqueRetained: dedupResult.uniqueArticles.length,
    exactDuplicatesPruned: dedupResult.exactDuplicates.length,
    nearDuplicatesPreserved: dedupResult.nearDuplicateCandidates.length
  });

  // ── AGENT 2 (Optional): Per-Article Classification ────────
  let processedArticles = dedupResult.uniqueArticles;

  if (classifyArticles && processedArticles.length > 0 && apiKey) {
    const classificationResults = [];
    for (const art of processedArticles.slice(0, 15)) {
      try {
        const cls = await classifySingleArticle({
          article: art,
          monitoringContext,
          companyProfile,
          provider,
          apiKey,
          fetchFn
        });
        classificationResults.push({ ...art, ai: cls });
      } catch (e) {
        classificationResults.push({ ...art });
      }
    }
    processedArticles = classificationResults;
    logStep('AGENT_CLASSIFIER_DONE', `Classified ${processedArticles.length} retained unique articles.`);
  }

  // ── AGENT 3: Threat Grouping & Incident Correlation Agent ─
  const groupingResult = await runGroupingAgent(processedArticles, {
    enableAiSynthesis: enableAiStoryGrouping,
    apiKey,
    provider,
    fetchFn
  });

  logStep('AGENT_3_GROUPING_DONE', {
    uniqueArticlesInput: processedArticles.length,
    correlatedIncidents: groupingResult.groupedEventCount
  });

  return {
    success: true,
    timeline: pipelineTimeline,
    deduplication: dedupResult,
    grouping: groupingResult,
    incidents: groupingResult.events,
    uniqueArticles: dedupResult.uniqueArticles
  };
}
