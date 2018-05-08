var postcss = require('postcss')
var selectorParser = require('postcss-selector-parser')
var cache = require('lru-cache')(100)

var deasync = require('deasync')

var currentId
var addId = postcss.plugin('add-id', function () {
  return function (root) {
    root.each(function rewriteSelector (node) {
      if (!node.selector) {
        // handle media queries
        if (node.type === 'atrule' && node.name === 'media') {
          node.each(rewriteSelector)
        }
        return
      }
      node.selector = selectorParser(function (selectors) {
        selectors.each(function (selector) {
          var node = null
          selector.each(function (n) {
            if (n.type !== 'pseudo') node = n
          })
          selector.insertAfter(node, selectorParser.attribute({
            attribute: currentId
          }))
        })
      }).process(node.selector).result
    })
  }
})

module.exports = deasync(function (id, css, cbk) {

    var key = id + '!!' + css
    var val = cache.get(key)
    if (val) {
        cbk(null, val)
        return
    }

    currentId = id

    postcss([addId])
        .process(css)
        .then(function (res) {
            cache.set(key, res.css);
            cbk(null, res.css);
        })
});
