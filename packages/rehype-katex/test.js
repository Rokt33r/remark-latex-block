/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable import/no-unassigned-import */
const test = require('tape')
const katex = require('katex')
const unified = require('unified')
const parseMarkdown = require('remark-parse')
const remark2rehype = require('remark-rehype')
const parseHtml = require('rehype-parse')
const stringify = require('rehype-stringify')
const math = require('../remark-math')
const rehypeKatex = require('.')

test('rehype-katex', function(t) {
  t.deepEqual(
    unified()
      .use(parseHtml, {fragment: true, position: false})
      .use(rehypeKatex)
      .use(stringify)
      .processSync(
        [
          '<p>Inline math <span class="math-inline">\\alpha</span>.</p>',
          '<p>Block math:</p>',
          '<div class="math-display">\\gamma</div>'
        ].join('\n')
      )
      .toString(),
    unified()
      .use(parseHtml, {fragment: true, position: false})
      .use(stringify)
      .processSync(
        [
          '<p>Inline math <span class="math-inline">' +
            katex.renderToString('\\alpha') +
            '</span>.</p>',
          '<p>Block math:</p>',
          '<div class="math-display">' +
            katex.renderToString('\\gamma', {displayMode: true}) +
            '</div>'
        ].join('\n')
      )
      .toString(),
    'should transform math with katex'
  )

  t.deepEqual(
    unified()
      .use(parseMarkdown, {position: false})
      .use(math)
      .use(remark2rehype)
      .use(rehypeKatex)
      .use(stringify)
      .processSync(
        [
          'Inline math $\\alpha$.',
          '',
          'Block math:',
          '',
          '$$',
          '\\gamma',
          '$$'
        ].join('\n')
      )
      .toString(),
    unified()
      .use(parseHtml, {fragment: true, position: false})
      .use(stringify)
      .processSync(
        [
          '<p>Inline math <span class="math math-inline">' +
            katex.renderToString('\\alpha') +
            '</span>.</p>',
          '<p>Block math:</p>',
          '<div class="math math-display">' +
            katex.renderToString('\\gamma', {displayMode: true}) +
            '</div>'
        ].join('\n')
      )
      .toString(),
    'should integrate with `remark-math`'
  )

  t.deepEqual(
    unified()
      .use(parseHtml, {fragment: true, position: false})
      .use(rehypeKatex)
      .use(stringify)
      .processSync(
        '<p>Double math <span class="math-inline math-display">\\alpha</span>.</p>'
      )
      .toString(),
    unified()
      .use(parseHtml, {fragment: true, position: false})
      .use(stringify)
      .processSync(
        '<p>Double math <span class="math-inline math-display">' +
          katex.renderToString('\\alpha', {displayMode: true}) +
          '</span>.</p>'
      )
      .toString(),
    'should transform `.math-inline.math-display` math with `displayMode: true`'
  )

  var macros = {'\\RR': '\\mathbb{R}'}

  t.deepEqual(
    unified()
      .use(parseHtml, {fragment: true, position: false})
      .use(rehypeKatex, {macros: macros})
      .use(stringify)
      .processSync('<span class="math-inline">\\RR</span>')
      .toString(),
    unified()
      .use(parseHtml, {fragment: true, position: false})
      .use(stringify)
      .processSync(
        '<span class="math-inline">' +
          katex.renderToString('\\RR', {macros: macros}) +
          '</span>'
      )
      .toString(),
    'should support `macros`'
  )

  t.deepEqual(
    unified()
      .use(parseHtml, {fragment: true, position: false})
      .use(rehypeKatex, {errorColor: 'orange'})
      .use(stringify)
      .processSync('<span class="math-inline">\\alpa</span>')
      .toString(),
    unified()
      .use(parseHtml, {fragment: true, position: false})
      .use(stringify)
      .processSync(
        '<span class="math-inline">' +
          katex.renderToString('\\alpa', {
            throwOnError: false,
            errorColor: 'orange'
          }) +
          '</span>'
      )
      .toString(),
    'should support `errorColor`'
  )

  t.deepEqual(
    unified()
      .use(parseHtml, {fragment: true})
      .use(rehypeKatex)
      .use(stringify)
      .processSync(
        '<p>Lorem</p>\n<p><span class="math-inline">\\alpa</span></p>'
      ).messages,
    [
      {
        message:
          'KaTeX parse error: Undefined control sequence: \\alpa at position 1: \\̲a̲l̲p̲a̲',
        name: '2:4-2:42',
        reason:
          'KaTeX parse error: Undefined control sequence: \\alpa at position 1: \\̲a̲l̲p̲a̲',
        line: 2,
        column: 4,
        location: {
          start: {line: 2, column: 4, offset: 16},
          end: {line: 2, column: 42, offset: 54}
        },
        source: 'rehype-katex',
        ruleId: 'parseerror',
        fatal: false
      }
    ],
    'should create a message for errors'
  )

  try {
    unified()
      .use(parseHtml, {fragment: true})
      .use(rehypeKatex, {throwOnError: true})
      .use(stringify)
      .processSync(
        '<p>Lorem</p>\n<p><span class="math-inline">\\alpa</span></p>'
      )
  } catch (error) {
    t.equal(
      error.message,
      'KaTeX parse error: Undefined control sequence: \\alpa at position 1: \\̲a̲l̲p̲a̲',
      'should throw an error if `throwOnError: true`'
    )
  }

  t.deepEqual(
    unified()
      .use(parseHtml, {fragment: true, position: false})
      .use(rehypeKatex, {errorColor: 'orange', strict: 'ignore'})
      .use(stringify)
      .processSync('<span class="math-inline">ê&amp;</span>')
      .toString(),
    unified()
      .use(parseHtml, {fragment: true, position: false})
      .use(stringify)
      .processSync(
        '<span class="math-inline"><span class="katex-error" title="ParseError: KaTeX parse error: Expected \'EOF\', got \'&\' at position 2: ê&̲" style="color:orange">ê&amp;</span></span>'
      )
      .toString(),
    'should support `strict: ignore`'
  )

  // Pregenerate a result without mhchem
  const noMhchemResult = unified()
    .use(parseHtml, {fragment: true, position: false})
    .use(rehypeKatex)
    .use(stringify)
    .processSync(
      [
        '<p>mhchem plugin:</p>',
        '<div class="math-display">\\ce{CO2 + C -> 2 CO}</div>'
      ].join('\n')
    )
    .toString()

  // Add mhchem to KaTeX
  require('katex/dist/contrib/mhchem')

  // Assert the results are differents with and without mhchem
  t.notEqual(
    noMhchemResult,
    unified()
      .use(parseHtml, {fragment: true, position: false})
      .use(stringify)
      .processSync(
        [
          '<p>mhchem plugin:</p>',
          '<div class="math-display">' +
            katex.renderToString('\\ce{CO2 + C -> 2 CO}', {displayMode: true}) +
            '</div>'
        ].join('\n')
      )
      .toString(),
    'should allow plugins'
  )

  t.end()
})
