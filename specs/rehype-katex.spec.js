const math = require('../packages/remark-math')
const katex = require('katex')
const rehypeKatex = require('../packages/rehype-katex')
const unified = require('unified')
const parse = require('remark-parse')
const rehypeParse = require('rehype-parse')
const remark2rehype = require('remark-rehype')
const stringify = require('rehype-stringify')
const u = require('unist-builder')
const h = require('hastscript')

function remark () {
  return unified()
    .use(parse)
}

function parseHtml (html) {
  return unified()
    .use(rehypeParse, { fragment: true, position: false })
    .parse(html)
}

it('should parse into katex', () => {
  const processor = remark()
    .use(math)
    .use(remark2rehype)
    .use(rehypeKatex)
    .use(stringify)

  const targetText = [
    '$\\alpha$',
    '$$',
    '\\alpha\\beta',
    '$$',
    'foo $$\\alpha$$ bar'
  ].join('\n')

  const result = processor.processSync(targetText).toString()
  const renderedAst = parseHtml(result)

  const expectedInlineMathChildren = parseHtml(katex.renderToString('\\alpha')).children
  const expectedMath = parseHtml(katex.renderToString('\\alpha\\beta', { displayMode: true })).children

  expect(renderedAst)
    .toEqual(u('root', { data: { quirksMode: false } }, [
      h('p', [
        h('span', { className: 'inlineMath' }, expectedInlineMathChildren)
      ]),
      u('text', '\n'),
      h('div', { className: 'math' }, expectedMath),
      u('text', '\n'),
      h('p', [
        u('text', 'foo '),
        h('span', { className: 'inlineMath' }, expectedInlineMathChildren),
        u('text', ' bar')
      ])
    ]))
})

it('should put inlineDoubles in katex displaystyle', () => {
  const processor = remark()
    .use(math, {
      inlineMathDouble: true
    })
    .use(remark2rehype)
    .use(rehypeKatex, {
      inlineMathDoubleDisplay: true
    })
    .use(stringify)

  const targetText = [
    '$\\alpha$',
    '$$',
    '\\alpha\\beta',
    '$$',
    'foo $$\\alpha$$ bar'
  ].join('\n')

  const result = processor.processSync(targetText).toString()
  const renderedAst = parseHtml(result)

  const expectedInlineMathChildren = parseHtml(katex.renderToString('\\alpha')).children
  const expectedMath = parseHtml(katex.renderToString('\\alpha\\beta', { displayMode: true })).children
  const expectedInlineMathDoubleChildren = parseHtml(katex.renderToString('\\alpha', { displayMode: true })).children

  expect(renderedAst)
    .toEqual(u('root', { data: { quirksMode: false } }, [
      h('p', [
        h('span', { className: 'inlineMath' }, expectedInlineMathChildren)
      ]),
      u('text', '\n'),
      h('div', { className: 'math' }, expectedMath),
      u('text', '\n'),
      h('p', [
        u('text', 'foo '),
        h('span', { className: ['inlineMath', 'inlineMathDouble'] }, expectedInlineMathDoubleChildren),
        u('text', ' bar')
      ])
    ]))
})

it('should take macros', () => {
  const macros = {
    '\\RR': '\\mathbb{R}'
  }

  const processor = remark()
    .use(math)
    .use(remark2rehype)
    .use(rehypeKatex, {
      errorColor: 'orange',
      macros: macros
    })
    .use(stringify)

  const targetText = '$\\RR$'

  const result = processor.processSync(targetText)
  const renderedAst = parseHtml(result.toString())

  const expectedInlineMathChildren = parseHtml(katex.renderToString('\\RR', { macros: macros })).children

  expect(renderedAst)
    .toEqual(u('root', { data: { quirksMode: false } }, [
      h('p', [
        h('span', { className: 'inlineMath' }, expectedInlineMathChildren)
      ])
    ]))
})

it('should handle error', () => {
  const processor = remark()
    .use(math)
    .use(remark2rehype)
    .use(rehypeKatex, {
      errorColor: 'orange'
    })
    .use(stringify)

  const targetText = '$\\alpa$'

  const result = processor.processSync(targetText)
  const renderedAst = parseHtml(result.toString())

  const expectedInlineMath = parseHtml(katex.renderToString('\\alpa', {
    throwOnError: false,
    errorColor: 'orange'
  })).children

  expect(renderedAst)
    .toEqual(u('root', { data: { quirksMode: false } }, [
      h('p', [
        h('span', { className: 'inlineMath' }, expectedInlineMath)
      ])
    ]))
})

it('should handle error even fallback rendering failed', () => {
  const processor = remark()
    .use(math)
    .use(remark2rehype)
    .use(rehypeKatex, {
      errorColor: 'orange',
      strict: 'ignore'
    })
    .use(stringify)

  const targetText = '$ê&$'

  const result = processor.processSync(targetText)
  const renderedAst = parseHtml(result.toString())

  expect(renderedAst)
    .toEqual(u('root', { data: { quirksMode: false } }, [
      h('p', [
        h('span', { className: 'inlineMath' }, [
          h('span', {
            className: 'katex-error',
            style: 'color:orange',
            title: 'ParseError: KaTeX parse error: Expected \'EOF\', got \'&\' at position 2: ê&̲'
          }, 'ê&')
        ])
      ])
    ]))
})

it('should throw parsing error if `throwOnError` set true', () => {
  const processor = remark()
    .use(math)
    .use(remark2rehype)
    .use(rehypeKatex, {
      throwOnError: true
    })
    .use(stringify)
  expect.assertions(1)

  const targetText = '$\\alpa$'

  try {
    processor.processSync(targetText)
  } catch (error) {
    expect(error).toMatchObject({
      name: 'ParseError',
      message: 'KaTeX parse error: Undefined control sequence: \\alpa at position 1: \\̲a̲l̲p̲a̲'
    })
  }
})
