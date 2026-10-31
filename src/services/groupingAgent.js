/**
 * Threat Grouping & Incident Correlation AI Agent (Agent 2)
 *
 * Specializes in:
 * 1. Clustering multiple distinct reporting articles into a single coherent incident/story.
 * 2. Multi-publisher corroboration level calculation (single source vs multi-outlet corroborated).
 * 3. Chronological timeline generation and incident title/synthesis.
 */

import { correlateArticlesIntoEvents } from './eventCorrelation.js';

export const GROUPING_AGENT_SYSTEM_PROMPT = `[ROLE: THREAT INCIDENT CORRELATION & GROUPING AGENT]
You are a specialized Threat Intelligence Correlation Agent.
Your job is to examine a cluster of distinct articles reporting on an event and:
1. Synthesize a unified incident headline and concise 2-sentence summary.
2. Determine if the reports represent independent corroborated accounts or circular reporting.
3. Compute an incident severity rating (HIGH | MED | LOW).
4. Identify all verified affected entities and locations.

Return ONLY a valid JSON object matching this schema:
{
  "incidentTitle": "Unified objective incident title",
  "incidentSummary": "2-sentence factual synthesis",
  "severity": "HIGH | MED | LOW",
  "primaryHazard": "Specific hazard name",
  "affectedEntities": ["Entity1", "Entity2"],
  "locations": ["City, Country"],
  "corroborationAnalysis": "Explanation of multi-publisher consistency"
}`;

/**
 * Runs the Grouping & Incident Correlation Agent on classified articles.
 * Combines deterministic spatial-temporal correlation with AI incident synthesis.
 */
export async function runGroupingAgent(classifiedArticles = [], options = {}) {
  const {
    enableAiSynthesis = false,
    apiKey = '',
    provider = 'groq',
    fetchFn = fetch
  } = options;

  // Step 1: Run base event correlation (groups by hazard, location proximity, and timeline)
  const correlatedEvents = correlateArticlesIntoEvents(classifiedArticles);

  // Step 2: If AI synthesis is enabled for multi-article clusters, synthesize executive briefings
  if (enableAiSynthesis && apiKey) {
    for (const event of correlatedEvents) {
      if (event.articles && event.articles.length > 1) {
        try {
          const articleSnippets = event.articles.slice(0, 5).map(a => ({
            source: a.source?.title || a.source?.uri || 'Source',
            title: a.title,
            summary: a.ai?.summary || (a.body || '').slice(0, 300)
          }));

          const response = await fetchFn('/api/ai-proxy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              provider,
              apiKey,
              model: 'openai/gpt-oss-120b',
              temperature: 0.1,
              messages: [
                { role: 'system', content: GROUPING_AGENT_SYSTEM_PROMPT },
                {
                  role: 'user',
                  content: JSON.stringify({
                    hazard: event.hazard,
                    location: event.primaryLocation,
                    articles: articleSnippets
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

            if (parsed.incidentTitle) event.title = parsed.incidentTitle;
            if (parsed.incidentSummary) event.summary = parsed.incidentSummary;
            if (parsed.severity) event.severity = parsed.severity;
            if (parsed.corroborationAnalysis) event.corroborationAnalysis = parsed.corroborationAnalysis;
            if (Array.isArray(parsed.affectedEntities)) event.affectedEntities = parsed.affectedEntities;
          }
        } catch (err) {
          console.warn('[GroupingAgent] AI synthesis skipped for event:', event.eventId, err.message);
        }
      }
    }
  }

  return {
    agent: 'GroupingAgent',
    version: '1.0.0',
    totalArticles: classifiedArticles.length,
    groupedEventCount: correlatedEvents.length,
    events: correlatedEvents
  };
}
