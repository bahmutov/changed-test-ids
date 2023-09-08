const babel = require('@babel/core')

// console.log(babel)

function isTestAttributeNode(node) {
  return (
    node.type === 'JSXAttribute' &&
    node.name.type === 'JSXIdentifier' &&
    node.name.name === 'testId'
  )
}

function isCyQueryCommandExpression(queryCommands, node) {
  return (
    node.callee.type === 'MemberExpression' &&
    node.callee.property.type === 'Identifier' &&
    queryCommands.includes(node.callee.property.name)
  )
}

function isCyTestAttributeSelector(node) {
  return (
    node &&
    node.type === 'StringLiteral' &&
    node.value.startsWith('[data-test=')
  )
}

function extractTestId(s) {
  if (s.startsWith('[') && s.endsWith(']')) {
    s = s.slice(1, s.length - 1)
    if (s.startsWith('data-test="')) {
      s = s.split('data-test="')[1]
      return s.slice(0, s.length - 1)
    } else if (s.startsWith('data-test=')) {
      return s.split('data-test=')[1]
    }
  }
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

/**
 * @typedef {Object} FindQueriesOptions
 * @property {string[]?} commands Names of custom commands to look for
 */

/**
 * Parses the given spec source code and finds all queried test id values.
 * @param {string} source The spec source code
 * @param {FindQueriesOptions} options Options controlling what to look for
 */
function findTestQueries(source, options = {}) {
  const testIds = []

  const ast = babel.parse(source)

  const queryCommands = ['get', 'find', ...(options.commands || [])]
  console.log('query commands to find', queryCommands)

  babel.traverse(ast, {
    CallExpression(a) {
      console.log('CallExpression')
      if (isCyQueryCommandExpression(queryCommands, a.node)) {
        // console.log(a.node)
        if (isCyTestAttributeSelector(a.node.arguments[0])) {
          const testId = extractTestId(a.node.arguments[0].value)
          console.log('found query test id "%s"', testId)
          testIds.push(testId)
        }
      }
    },
  })

  return testIds
}

module.exports = { findTestAttributes, findTestQueries }
