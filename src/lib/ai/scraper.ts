// Web scraper for getting detailed model information from web pages

interface ScrapedContent {
  title: string;
  content: string;
  url: string;
}

// Scrape content using Jina Reader API
export async function scrapeWithJina(url: string): Promise<ScrapedContent | null> {
  try {
    const response = await fetch(`https://r.jina.ai/${url}`, {
      headers: {
        Authorization: `Bearer ${process.env.JINA_API_KEY}`,
        'X-Return-Format': 'markdown',
      },
    });

    if (!response.ok) {
      throw new Error(`Jina scrape failed: ${response.statusText}`);
    }

    const content = await response.text();

    return {
      title: url.split('/').pop() || 'Unknown',
      content,
      url,
    };
  } catch (error) {
    console.error('Error scraping with Jina:', error);
    return null;
  }
}

// Search and scrape using Tavily
export async function searchWithTavily(
  query: string,
  maxResults = 5
): Promise<{ results: { title: string; url: string; content: string }[] }> {
  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: process.env.TAVILY_API_KEY,
        query,
        max_results: maxResults,
        include_raw_content: true,
        search_depth: 'advanced',
      }),
    });

    if (!response.ok) {
      throw new Error(`Tavily search failed: ${response.statusText}`);
    }

    const data = await response.json();
    return { results: data.results || [] };
  } catch (error) {
    console.error('Error searching with Tavily:', error);
    return { results: [] };
  }
}

// Get benchmark data for a model
export async function scrapeBenchmarks(modelName: string, provider: string): Promise<Record<string, number>> {
  const query = `${modelName} ${provider} benchmark results MMLU HumanEval GPQA`;

  const searchResults = await searchWithTavily(query, 3);

  // Parse benchmark data from search results
  const benchmarks: Record<string, number> = {};

  for (const result of searchResults.results) {
    const content = result.content.toLowerCase();

    // Common benchmark patterns
    const patterns = [
      { key: 'mmlu', regex: /mmlu[:\s]+(\d+\.?\d*)/i },
      { key: 'humaneval', regex: /human\s?eval[:\s]+(\d+\.?\d*)/i },
      { key: 'gpqa', regex: /gpqa[:\s]+(\d+\.?\d*)/i },
      { key: 'math', regex: /math[:\s]+(\d+\.?\d*)/i },
      { key: 'hellaswag', regex: /hellaswag[:\s]+(\d+\.?\d*)/i },
      { key: 'arc', regex: /arc[:\s]+(\d+\.?\d*)/i },
      { key: 'winogrande', regex: /winogrande[:\s]+(\d+\.?\d*)/i },
      { key: 'truthfulqa', regex: /truthfulqa[:\s]+(\d+\.?\d*)/i },
    ];

    for (const { key, regex } of patterns) {
      const match = content.match(regex);
      if (match && !benchmarks[key]) {
        benchmarks[key] = parseFloat(match[1]);
      }
    }
  }

  return benchmarks;
}

// Get documentation content
export async function scrapeDocumentation(url: string): Promise<string> {
  const content = await scrapeWithJina(url);
  return content?.content || '';
}

// Get model comparison data
export async function scrapeComparisons(
  modelName: string,
  provider: string
): Promise<{ model: string; comparison: string }[]> {
  const query = `${modelName} vs comparison GPT Claude Gemini benchmark`;

  const searchResults = await searchWithTavily(query, 3);
  const comparisons: { model: string; comparison: string }[] = [];

  // Extract comparison mentions
  const competitors = ['GPT-4', 'GPT-4o', 'Claude', 'Gemini', 'Llama', 'Mistral'];

  for (const result of searchResults.results) {
    for (const competitor of competitors) {
      if (result.content.toLowerCase().includes(competitor.toLowerCase())) {
        // Extract a snippet about the comparison
        const regex = new RegExp(
          `[^.]*${competitor}[^.]*${modelName}[^.]*\\.|[^.]*${modelName}[^.]*${competitor}[^.]*\\.`,
          'gi'
        );
        const matches = result.content.match(regex);
        if (matches && matches.length > 0) {
          comparisons.push({
            model: competitor,
            comparison: matches[0].trim(),
          });
        }
      }
    }
  }

  return comparisons.slice(0, 5); // Return top 5 comparisons
}
