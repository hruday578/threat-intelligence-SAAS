/**
 * AertEM NewsAPI.ai / Event Registry Ingestion Service
 * Handles compliant querying of https://eventregistry.org/api/v1/article/getArticles
 * with rate limiting, error classification, and incremental fetching.
 */

const NEWS_PROXY_URL = '/news-proxy';

/**
 * Validates whether the API key is present and well-formed
 */
export function validateNewsApiKey(key) {
  if (!key || typeof key !== 'string' || key.trim().length < 8) {
    return {
      valid: false,
      error: 'NewsAPI.ai key is missing or invalid. Please configure NEWSAPI_AI_KEY or VITE_NEWSAPI_KEY.'
    };
  }
  return { valid: true, key: key.trim() };
}

/**
 * Builds standard Event Registry AQL JSON payload
 */
export function buildEventRegistryPayload({
  apiKey,
  queryParts = [],
  count = 100,
  sortBy = 'date',
  articleBodyLen = 1000
}) {
  const allConditions = [{ "lang": "eng" }, ...queryParts];

  return {
    apiKey,
    action: "getArticles",
    articlesCount: Math.min(count, 100),
    articlesSortBy: sortBy,
    articlesSortByAsc: false,
    resultType: "articles",
    dataType: ["news"],
    articleBodyLen,
    keywordSearchMode: "simple",
    query: {
      "$query": allConditions.length === 1 ? allConditions[0] : { "$and": allConditions }
    }
  };
}

/**
 * Executes fetch with retry, rate limit handling, and timeout guard
 */
export async function fetchEventRegistryArticles(payload, options = {}) {
  const { maxRetries = 2, timeoutMs = 25000, fetchFn = fetch } = options;

  let lastError = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const controller = new AbortController();
    const timeoutTimer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetchFn(NEWS_PROXY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutTimer);

      if (response.status === 401 || response.status === 403) {
        throw new Error('NewsAPI.ai authentication failure (401/403). Verify that your API key is active and has sufficient tokens.');
      }

      if (response.status === 429) {
        throw new Error('NewsAPI.ai rate limit exceeded (429). Please wait before initiating another scan.');
      }

      if (!response.ok) {
        let errMessage = `HTTP ${response.status}`;
        try {
          const errData = await response.json();
          if (errData?.error) errMessage = errData.error;
        } catch (_) {}
        throw new Error(`NewsAPI.ai error: ${errMessage}`);
      }

      const data = await response.json();

      if (data?.error) {
        throw new Error(typeof data.error === 'string' ? data.error : JSON.stringify(data.error));
      }

      // Filter non-English results as fallback
      const results = (data?.articles?.results || []).filter(a => !a.lang || a.lang === 'eng');

      return {
        results,
        totalResults: data?.articles?.totalResults || results.length,
        page: data?.articles?.page || payload.articlesPage || 1,
        pages: data?.articles?.pages || 1,
        rawResponse: data
      };
    } catch (err) {
      clearTimeout(timeoutTimer);
      lastError = err;

      // Do not retry 401/403 auth errors
      if (err.message.includes('401') || err.message.includes('403') || err.message.includes('authentication')) {
        throw err;
      }

      if (attempt < maxRetries - 1) {
        // Linear backoff
        await new Promise(r => setTimeout(r, 1200 * (attempt + 1)));
      }
    }
  }

  throw lastError || new Error('Failed to fetch articles after retries.');
}

/**
 * Fetches all matching articles across all pages (or up to maxPages cap).
 */
export async function fetchAllEventRegistryPages(payload, options = {}) {
  const { maxPages = 20, onPageLoaded } = options;
  let currentPage = 1;
  let totalPages = 1;
  let allResults = [];
  let lastData = null;

  while (currentPage <= totalPages && currentPage <= maxPages) {
    const pagePayload = {
      ...payload,
      articlesPage: currentPage,
      articlesCount: Math.min(payload.articlesCount || 100, 100)
    };

    const pageRes = await fetchEventRegistryArticles(pagePayload, options);
    lastData = pageRes;
    const pageArticles = pageRes.results || [];
    allResults.push(...pageArticles);

    totalPages = pageRes.pages || 1;
    if (onPageLoaded) {
      onPageLoaded({ page: currentPage, totalPages, articles: pageArticles, totalFetched: allResults.length });
    }

    // If no articles returned or reached last page, stop
    if (pageArticles.length === 0 || currentPage >= totalPages) break;
    currentPage++;
  }

  return {
    results: allResults,
    totalResults: lastData?.totalResults || allResults.length,
    pages: totalPages,
    totalPagesFetched: currentPage - 1
  };
}
