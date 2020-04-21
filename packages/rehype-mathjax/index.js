const visit = require('unist-util-visit')
const toText = require('hast-util-to-text')
const renderer = require('./renderer')

module.exports = rehypeMathJax

function rehypeMathJax() {
  return transformMath
}

function transformMath(tree) {
  let found = false

  visit(tree, 'element', onelement)

  if (found) {
    tree.children.push(renderer.styleSheet())
  }

  function onelement(element) {
    const classes = element.properties.className || []
    const inline = classes.includes('math-inline')
    const display = classes.includes('math-display')

    if (!inline && !display) {
      return
    }

    found = true
    element.children = [renderer.render(toText(element), {display: display})]

    return visit.SKIP
  }
}
