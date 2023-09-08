const babel = require('@babel/core')

// console.log(babel)

function isTestAttributeNode(node) {
  return (
    node.type === 'JSXAttribute' &&
    node.name.type === 'JSXIdentifier' &&
    node.name.name === 'testId'
  )
}

function findTestAttributes(source) {
  const ast = babel.parse(source, {
    plugins: ['@babel/plugin-syntax-jsx'],
  })

  // console.log(ast.program.body)

  const testIds = []

  babel.traverse(ast, {
    JSXElement(a) {
      // console.log('JSXElement')
      // console.log(a.node.openingElement.attributes)
      a.node.openingElement.attributes.forEach((node) => {
        if (isTestAttributeNode(node)) {
          const testId = node.value.value
          console.log('found test id "%s"', testId)
          testIds.push(testId)
        }
      })
    },
  })
  return testIds
}

module.exports = { findTestAttributes }
