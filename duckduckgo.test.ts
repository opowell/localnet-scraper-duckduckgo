import { afterEach, describe, expect, it } from 'vitest'
import { parserLoader, resetPage, visit } from '#scraper-test'

// The parser, evaluated with the helpers it is injected with, as a scrape runs it.
const load = parserLoader(__dirname)

afterEach(resetPage)

describe('search engines', () => {
  it.each([
    ['duckduckgo.js', 'parseDuckDuckGo', 'https://duckduckgo.com/?q=rust&ia=web', `
      <ol>
        <li data-layout="ad"><article data-testid="result"><a data-testid="result-title-a" href="https://ad.example/">An ad</a></article></li>
        <li data-layout="organic"><article data-testid="result"><h2><a data-testid="result-title-a" href="https://one.example/a">One</a></h2></article></li>
        <li data-layout="organic"><article data-testid="result"><h2><a data-testid="result-title-a" href="https://two.example/b">Two</a></h2></article></li>
      </ol>`],
    ['duckduckgo.js', 'parseDuckDuckGo', 'https://html.duckduckgo.com/html/?q=rust', `
      <div class="result result--ad"><a class="result__a" href="https://duckduckgo.com/y.js?ad_domain=ad.example">An ad</a></div>
      <div class="result"><a class="result__a" href="//duckduckgo.com/l/?uddg=https%3A%2F%2Fone.example%2Fa&amp;rut=x">One</a></div>
      <div class="result"><a class="result__a" href="//duckduckgo.com/l/?uddg=https%3A%2F%2Ftwo.example%2Fb&amp;rut=x">Two</a></div>`],
    ['duckduckgo.js', 'parseDuckDuckGo', 'https://lite.duckduckgo.com/lite/?q=rust', `
      <table>
        <tr class="result-sponsored"><td><a class="result-link" href="https://ad.example/">An ad</a></td></tr>
        <tr><td><a class="result-link" href="//duckduckgo.com/l/?uddg=https%3A%2F%2Fone.example%2Fa">One</a></td></tr>
        <tr><td><a class="result-link" href="https://two.example/b">Two</a></td></tr>
      </table>`],
  ])('%s reads %s\'s page as a listing of its results, in order, leaving out its ads and its own pages', async (file, parser, url, body) => {
    visit(url, body)
    expect(await load(file, [parser])[parser]()).toEqual({
      listing: true,
      content: [],
      links: [
        { url: 'https://one.example/a', title: 'One', score: 1 },
        { url: 'https://two.example/b', title: 'Two', score: 1 / 1.1 },
      ],
    })
  })

  it.each([
    ['duckduckgo.js', 'parseDuckDuckGo', 'https://duckduckgo.com/?q=rust', '<div data-testid="anomaly-modal-tile-1"></div>'],
    ['duckduckgo.js', 'parseDuckDuckGo', 'https://html.duckduckgo.com/html/?q=rust', '<form id="challenge-form"></form>'],
  ])('%s says the site blocked it on its bot check', async (file, parser, url, body) => {
    visit(url, body)
    expect(await load(file, [parser])[parser]()).toEqual({ listing: true, content: [], blocked: expect.stringContaining('person is searching') })
  })

  it.each([
    ['duckduckgo.js', 'parseDuckDuckGo', 'https://duckduckgo.com/about'],
  ])('%s leaves a page that is no search to the default parse', async (file, parser, url) => {
    visit(url, '<p>Text</p>')
    expect(await load(file, [parser])[parser]()).toBeNull()
  })
})
