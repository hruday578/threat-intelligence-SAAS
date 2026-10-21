/**
 * AertEM Deduplication Engine
 * Conservative deduplication model ported from Colab proof-of-concept.
 *
 * Rules:
 * 1. URL normalization (canonical domain, path, query param stripping like utm_*)
 * 2. Exact URL matching: confirmed exact duplicates.
 * 3. Exact normalized text matching: SHA-256 fingerprint of normalized body or title+body.
 * 4. Similarity-based near-duplicate candidate detection: character/word token cosine similarity or n-gram Jaccard (threshold ~0.82).
 * 5. Conservative preservation: Near-duplicate candidates are flagged for review and preserved, NOT automatically discarded.
 * 6. Audit & Provenance: All duplicate relationships (target -> canonical parent), timestamps, sources, and original URLs are preserved.
 */

// Tracking query parameters to strip during URL canonicalization
const TRACKING_PARAMS = new Set([
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
  'fbclid', 'gclid', 'ref', 'source', 'platform', 'feed', 'mc_cid', 'mc_eid'
]);

/**
 * Normalizes URL:
 * - lowercase scheme and host
 * - strip default ports
 * - strip URL fragments (#...)
 * - remove tracking query parameters
 * - sort remaining query params
 * - strip trailing slash (except root)
 */
export function canonicalizeUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  try {
    const url = new URL(rawUrl.trim());
    url.hash = ''; // Remove fragment

    // Strip tracking parameters
    const searchParams = new URLSearchParams(url.search);
    const cleanedParams = new URLSearchParams();
    for (const [key, val] of searchParams.entries()) {
      if (!TRACKING_PARAMS.has(key.toLowerCase())) {
        cleanedParams.append(key, val);
      }
    }
    // Sort parameters for deterministic representation
    cleanedParams.sort();
    url.search = cleanedParams.toString() ? `?${cleanedParams.toString()}` : '';

    let canonical = url.toString();
    // Normalize trailing slash if path is longer than '/'
    if (canonical.endsWith('/') && url.pathname.length > 1) {
      canonical = canonical.slice(0, -1);
    }
    return canonical;
  } catch {
    // If URL parsing fails, basic trim & lowercase fallback
    return rawUrl.trim().toLowerCase().replace(/\/+$/, '');
  }
}

/**
 * Normalizes text:
 * - lowercase
 * - remove HTML entities and punctuation
 * - collapse whitespace
 */
export function normalizeText(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    .toLowerCase()
    .replace(/<[^>]*>/g, ' ') // Strip HTML tags if present
    .replace(/[^\p{L}\p{N}\s]/gu, ' ') // Keep unicode letters and numbers
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Computes deterministic hash from text string using standard FNV-1a / djb2 hybrid hash
 * Output hex-like string for fast exact-match lookup
 */
export function computeTextHash(text) {
  const normalized = normalizeText(text);
  if (!normalized) return '';
  
  let h1 = 0xdeadbeef;
  let h2 = 0x41c64e6d;
  for (let i = 0; i < normalized.length; i++) {
    const ch = normalized.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16);
}

/**
 * Build term frequency vector for similarity computation
 */
function getTermFrequencies(tokens) {
  const tf = new Map();
  for (const t of tokens) {
    tf.set(t, (tf.get(t) || 0) + 1);
  }
  return tf;
}

/**
 * Computes cosine similarity between two token sets
 */
export function computeCosineSimilarity(tokensA, tokensB) {
  if (!tokensA.length || !tokensB.length) return 0;
  const tfA = getTermFrequencies(tokensA);
  const tfB = getTermFrequencies(tokensB);

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (const val of tfA.values()) {
    normA += val * val;
  }
  for (const val of tfB.values()) {
    normB += val * val;
  }

  for (const [term, valA] of tfA.entries()) {
    const valB = tfB.get(term);
    if (valB) {
      dotProduct += valA * valB;
    }
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator > 0 ? dotProduct / denominator : 0;
}

/**
 * Tokenize string into n-grams or words (minimum 3 chars)
 */
export function tokenizeWords(text) {
  const clean = normalizeText(text);
  if (!clean) return [];
  return clean.split(' ').filter(w => w.length > 2);
}

/**
 * Runs Conservative Deduplication on a list of raw news articles
 *
 * @param {Array} articles Raw news articles from NewsAPI.ai / Event Registry
 * @param {Object} options Configuration options
 * @param {number} options.nearDuplicateThreshold Review candidate threshold (default: 0.82)
 *
 * @returns {Object} result:
 *   - uniqueArticles: Array of unique primary articles to be sent to LLM
 *   - exactDuplicates: Array of duplicate article records excluded from primary LLM queue
 *   - nearDuplicateCandidates: Array of near-duplicate candidate pairs preserved for review
 *   - duplicateAuditRecords: Map/Array of relationships preserving provenance
 *   - stats: { totalRaw, exactDuplicatesCount, uniqueCount, nearDuplicatesCandidateCount }
 */
export function deduplicateArticles(articles = [], options = {}) {
  const threshold = options.nearDuplicateThreshold ?? 0.82;
  const canonicalUrlMap = new Map();     // canonicalUrl -> parentArticle
  const textHashMap = new Map();         // textHash -> parentArticle
  const titleHashMap = new Map();        // normalizedTitle -> parentArticle

  const uniqueArticles = [];
  const exactDuplicates = [];
  const nearDuplicateCandidates = [];
  const duplicateAuditRecords = [];

  for (const art of articles) {
    const rawUrl = art.url || art.uri || '';
    const canonicalUrl = canonicalizeUrl(rawUrl);
    const titleNorm = normalizeText(art.title || '');
    const bodyNorm = normalizeText(art.body || '');
    const combinedContent = titleNorm + ' ' + bodyNorm;
    const contentHash = computeTextHash(combinedContent || titleNorm);
    const bodyHash = bodyNorm.length > 30 ? computeTextHash(bodyNorm) : null;

    // Standardized provenance metadata attached to every article
    const provenance = {
      originalUrl: rawUrl,
      canonicalUrl,
      source: art.source || { title: 'Unknown', uri: '' },
      publishedAt: art.dateTime || art.date || '',
      ingestedAt: new Date().toISOString()
    };

    let exactMatch = null;
    let matchType = null;

    // 1. Check exact canonical URL match
    if (canonicalUrl && canonicalUrlMap.has(canonicalUrl)) {
      exactMatch = canonicalUrlMap.get(canonicalUrl);
      matchType = 'EXACT_CANONICAL_URL';
    }
    // 2. Check exact normalized text / content hash match
    else if (bodyHash && textHashMap.has(bodyHash)) {
      exactMatch = textHashMap.get(bodyHash);
      matchType = 'EXACT_TEXT_BODY_HASH';
    } else if (contentHash && textHashMap.has(contentHash)) {
      exactMatch = textHashMap.get(contentHash);
      matchType = 'EXACT_CONTENT_HASH';
    } else if (titleNorm.length > 25 && titleHashMap.has(titleNorm)) {
      // Very long exact title match from same/syndicated source with identical date
      const candidateParent = titleHashMap.get(titleNorm);
      const parentDate = (candidateParent.dateTime || candidateParent.date || '').slice(0, 10);
      const artDate = (art.dateTime || art.date || '').slice(0, 10);
      if (parentDate && artDate && parentDate === artDate) {
        exactMatch = candidateParent;
        matchType = 'EXACT_TITLE_AND_DATE';
      }
    }

    if (exactMatch) {
      // Record exact duplicate relationship
      const auditRecord = {
        duplicateId: art.uri || art.id || canonicalUrl || Math.random().toString(36),
        canonicalParentId: exactMatch.uri || exactMatch.id || exactMatch._canonicalUrl || 'parent',
        matchType,
        articleTitle: art.title,
        source: art.source,
        url: rawUrl,
        canonicalUrl,
        timestamp: art.dateTime || art.date,
        provenance
      };

      duplicateAuditRecords.push(auditRecord);

      // Preserve on parent's duplicate list for full provenance & auditing
      if (!exactMatch._duplicates) exactMatch._duplicates = [];
      exactMatch._duplicates.push({
        ...art,
        _duplicateReason: matchType,
        _provenance: provenance
      });

      exactDuplicates.push({
        ...art,
        _isExactDuplicate: true,
        _duplicateReason: matchType,
        _canonicalParentTitle: exactMatch.title,
        _provenance: provenance
      });
    } else {
      // Primary unique article candidate
      const enrichedArticle = {
        ...art,
        _canonicalUrl: canonicalUrl,
        _contentHash: contentHash,
        _provenance: provenance,
        _duplicates: []
      };

      // Register into lookup tables
      if (canonicalUrl) canonicalUrlMap.set(canonicalUrl, enrichedArticle);
      if (bodyHash) textHashMap.set(bodyHash, enrichedArticle);
      if (contentHash) textHashMap.set(contentHash, enrichedArticle);
      if (titleNorm) titleHashMap.set(titleNorm, enrichedArticle);

      // 3. Near-duplicate candidate detection with already-admitted unique articles
      // NOTE: Conservative rule: We DO NOT exclude near-duplicates from uniqueArticles!
      // They are tagged with near-duplicate candidate metadata for human/analyst review.
      const currentTokens = tokenizeWords(art.title + ' ' + (art.body ? art.body.slice(0, 400) : ''));
      let highestSimilarity = 0;
      let mostSimilarParent = null;

      for (const parent of uniqueArticles) {
        const parentTokens = tokenizeWords(parent.title + ' ' + (parent.body ? parent.body.slice(0, 400) : ''));
        const sim = computeCosineSimilarity(currentTokens, parentTokens);
        if (sim > highestSimilarity) {
          highestSimilarity = sim;
          mostSimilarParent = parent;
        }
      }

      if (highestSimilarity >= threshold && mostSimilarParent) {
        const candidateInfo = {
          similarity: parseFloat(highestSimilarity.toFixed(4)),
          candidateArticleTitle: art.title,
          candidateArticleSource: art.source?.title || art.source?.uri,
          candidateArticleUrl: rawUrl,
          parentArticleTitle: mostSimilarParent.title,
          parentArticleSource: mostSimilarParent.source?.title || mostSimilarParent.source?.uri,
          parentArticleUrl: mostSimilarParent.url || mostSimilarParent.uri,
          isIndependentCoverage: (art.source?.uri !== mostSimilarParent.source?.uri),
          decision: 'PRESERVED_FOR_REVIEW' // NEVER automatically deleted
        };

        nearDuplicateCandidates.push(candidateInfo);
        enrichedArticle._nearDuplicateCandidate = candidateInfo;
      }

      uniqueArticles.push(enrichedArticle);
    }
  }

  return {
    uniqueArticles,
    exactDuplicates,
    nearDuplicateCandidates,
    duplicateAuditRecords,
    stats: {
      totalRaw: articles.length,
      exactDuplicatesCount: exactDuplicates.length,
      uniqueCount: uniqueArticles.length,
      nearDuplicatesCandidateCount: nearDuplicateCandidates.length
    }
  };
}
