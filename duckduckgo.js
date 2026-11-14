// A DuckDuckGo search's page of results, read as a listing of what it found (see searchResultsOf), from any of its three
// sites: duckduckgo.com/?q=…, whose results its scripts draw (each an article[data-testid="result"], waited for up to
// 6 s, its title link a[data-testid="result-title-a"]; ads are in items of their own, [data-layout="ad"]), and the
// versions without scripts, html.duckduckgo.com/html/?q=… (.result a.result__a, ads .result--ad) and
// lite.duckduckgo.com/lite/?q=… (a.result-link, ads in tr.result-sponsored rows). Those two send each result through
// DuckDuckGo's redirect, /l/?uddg=<the result's URL>, read as where it leads. DuckDuckGo asks a browser it takes for a
// bot to pick out ducks before it shows anything (its anomaly modal, or the challenge form on the versions without
// scripts): the parser says the site blocked it (blocked), so it is left alone for a while.
async function parseDuckDuckGo() {
  if (!/(?:^|\.)duckduckgo\.com$/.test(location.hostname)) {
    return null
  }
  const lite = location.hostname === 'lite.duckduckgo.com'
  const html = location.hostname === 'html.duckduckgo.com'
  if (!lite && !html && !new URLSearchParams(location.search).get('q')) {
    return null
  }
  const challenge = '[data-testid^="anomaly-modal"], #challenge-form, .anomaly-modal__modal'
  const selector = lite
    ? 'tr:not(.result-sponsored) a.result-link'
    : html
      ? '.result:not(.result--ad) a.result__a'
      : 'article[data-testid="result"] a[data-testid="result-title-a"]'
  await waitFor(() => document.querySelector(`${selector}, ${challenge}`), lite || html ? 0 : 6000)
  if (document.querySelector(challenge)) {
    return { listing: true, content: [], blocked: 'DuckDuckGo asked to confirm that a person is searching' }
  }
  const results = Array.from(document.querySelectorAll(selector))
    .filter(a => !a.closest('[data-layout="ad"]'))
    .map(a => ({ url: duckDuckGoTarget(a.href), title: a.textContent }))
  return searchResultsOf('DuckDuckGo', results)
}

// Where a result's link leads: the link itself, unless it is DuckDuckGo's redirect (/l/?uddg=<url>).
function duckDuckGoTarget(href) {
  const url = new URL(href)
  return /(?:^|\.)duckduckgo\.com$/.test(url.hostname) ? url.searchParams.get('uddg') : href
}

// The parser a scrape calls.
registerParser(parseDuckDuckGo)
