const {mathjax} = require('mathjax-full/js/mathjax')
const {TeX} = require('mathjax-full/js/input/tex')
const {SVG} = require('mathjax-full/js/output/svg')
const {AllPackages} = require('mathjax-full/js/input/tex/AllPackages')
const register = require('mathjax-full/js/handlers/html').RegisterHTMLHandler
const fromDom = require('hast-util-from-dom')
const adaptor = require('./adaptor')

class SvgRenderer {
  constructor(options) {
    this.adaptor = adaptor()
    register(this.adaptor)
    this.InputJax = new TeX({packages: AllPackages})
    this.OutputJax = new SVG(options)
    this.mathDocument = mathjax.document('', {
      InputJax: this.InputJax,
      OutputJax: this.OutputJax
    })
  }

  get styleSheet() {
    return {
      type: 'element',
      tagName: 'style',
      properties: {},
      children: [
        {
          type: 'text',
          value: this.adaptor.textContent(
            this.OutputJax.styleSheet(this.mathDocument)
          )
        }
      ]
    }
  }

  render(latex, options) {
    return fromDom(this.mathDocument.convert(latex, options))
  }
}

module.exports = SvgRenderer
