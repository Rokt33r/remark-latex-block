const math = require('../packages/remark-math')
const unified = require('unified')
const parse = require('remark-parse')
const stringify = require('remark-stringify')
const u = require('unist-builder')

function remark () {
  return unified()
    .use(parse, {position: false})
    .use(stringify)
}

it('must parse a math inline and a math block ', () => {
  const processor = remark()
    .use(math)

  const targetText = [
    'Math $\\alpha$',
    '',
    '$$',
    '\\beta+\\gamma',
    '$$'
  ].join('\n')

  const ast = processor.parse(targetText)

  expect(ast).toMatchObject(u('root', [
    u('paragraph', [
      u('text', 'Math '),
      u('inlineMath', '\\alpha')
    ]),
    u('math', '\\beta+\\gamma')
  ]))
})

it('must escape a dollar with back slash', () => {
  const processor = remark()
    .use(math)

  const targetText = '$\\alpha\\$'

  const ast = processor.parse(targetText)
  expect(ast).toMatchObject(u('root', [
    u('paragraph', [
      u('text', '$\\alpha$')
    ])
  ]))
})

it('must NOT escape a dollar with double backslashes', () => {
  const processor = remark()
    .use(math)

  const targetText = '\\\\$\\alpha$'

  const ast = processor.parse(targetText)

  expect(ast).toMatchObject(u('root', [
    u('paragraph', [
      u('text', '\\'),
      u('inlineMath', '\\alpha')
    ])
  ]))
})

it('must render a super factorial to a math block', () => {
  const processor = remark()
    .use(math)

  const targetText = '$\\alpha\\$$'

  const ast = processor.parse(targetText)

  expect(ast).toMatchObject(u('root', [
    u('paragraph', [
      u('inlineMath', '\\alpha\\$')
    ])
  ]))
})

it('must render super factorial to a math inline', () => {
  const processor = remark()
    .use(math)

  const targetText = [
    '$$',
    '\\alpha\\$',
    '$$'
  ].join('\n')

  const ast = processor.parse(targetText)

  expect(ast).toMatchObject(u('root', [
    u('math', '\\alpha\\$')
  ]))
})

it('must render a math block just after a pragraph', () => {
  const processor = remark()
    .use(math)

  const targetText = [
    'tango',
    '$$',
    '\\alpha',
    '$$'
  ].join('\n')

  const ast = processor.parse(targetText)

  expect(ast).toMatchObject(u('root', [
    u('paragraph', [u('text', 'tango')]),
    u('math', '\\alpha')
  ]))
})

it('must parse inline math between double dollars', () => {
  const processor = remark()
    .use(math)

  const targetText = '$$\\alpha$$'

  const ast = processor.parse(targetText)

  expect(ast).toMatchObject(u('root', [
    u('paragraph', [
      u('inlineMath', '\\alpha')
    ])
  ]))
})

it('must stringify', () => {
  const processor = remark()
    .use(math)

  const targetText = [
    '$$\\alpha$$',
    '$$',
    '\\alpha\\beta',
    '$$'
  ].join('\n')

  const result = processor.processSync(targetText).toString()

  expect(result).toEqual([
    '$\\alpha$',
    '',
    '$$',
    '\\alpha\\beta',
    '$$',
    ''
  ].join('\n'))
})

it('must stringify math block child of blockquote', () => {
  const processor = remark()
    .use(math)

  const targetText = [
    '> $$',
    '> \\alpha\\beta',
    '> $$'
  ].join('\n')

  const result = processor.processSync(targetText).toString()

  expect(result).toEqual([
    '> $$',
    '> \\alpha\\beta',
    '> $$',
    ''
  ].join('\n'))
})

it('must parse math block with indent', () => {
  const processor = remark()
    .use(math)

  const targetText = [
    '  $$$',
    '    \\alpha',
    '  $$$'
  ].join('\n')

  const ast = processor.parse(targetText)

  expect(ast).toMatchObject(u('root', [
    u('math', '  \\alpha')
  ]))
})

it('must ignore everything just after opening/closing marker', () => {
  const processor = remark()
    .use(math)

  const targetText = [
    '$$  must',
    '\\alpha',
    '$$  be ignored',
    ''
  ].join('\n')

  const ast = processor.parse(targetText)

  expect(ast).toMatchObject(u('root', [
    u('math', '\\alpha')
  ]))
})

it('must not affect next block', () => {
  const processor = remark()
    .use(math)

  const targetText = [
    '$$',
    '\\alpha',
    '$$',
    '```',
    'code fence',
    '```'
  ].join('\n')

  const ast = processor.parse(targetText)

  expect(ast).toMatchObject(u('root', [
    u('math', '\\alpha'),
    u('code', 'code fence')
  ]))
})

it('must not set inlineMathDouble class', () => {
  const processor = remark()
    .use(math)

  const targetText = [
    '$$\\alpha$$'
  ].join('\n')

  const ast = processor.parse(targetText)

  expect(ast).toEqual(u('root', [
    u('paragraph', [
      u('inlineMath', {
        data: {
          hChildren: [
            u('text', '\\alpha')
          ],
          hName: 'span',
          hProperties: {
            className: 'inlineMath'
          }
        }
      }, '\\alpha')
    ])
  ]))
})

it('must set inlineMathDouble class if inlineMathDouble is true', () => {
  const processor = remark()
    .use(math, {
      inlineMathDouble: true
    })

  const targetText = [
    '$$\\alpha$$'
  ].join('\n')

  const ast = processor.parse(targetText)

  expect(ast).toEqual(u('root', [
    u('paragraph', [
      u('inlineMath', {
        data: {
          hChildren: [
            u('text', '\\alpha')
          ],
          hName: 'span',
          hProperties: {
            className: 'inlineMath inlineMathDouble'
          }
        }
      }, '\\alpha')
    ])
  ]))
})
