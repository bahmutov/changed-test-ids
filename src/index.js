const debug = require('debug')('changed-test-ids')
const babel = require('@babel/parser')
const traverse = require('@babel/core').traverse
const fs = require('fs')

// console.log(babel)

function isTestAttributeNode(names, node) {
  return (
    node.type === 'JSXAttribute' &&
    node.name.type === 'JSXIdentifier' &&
    names.includes(node.name.name)
  )
}

function isCyQueryCommandExpression(node) {
  const queries = ['get', 'find']
  return (
    node.callee.type === 'MemberExpression' &&
    node.callee.property.type === 'Identifier' &&
    queries.includes(node.callee.property.name)
  )
}

function isCyCustomQueryExpression(queryCommands, node) {
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

  return s
}

function findTestAttributes(source, options = {}) {
  let ast

  try {
    ast = babel.parse(source, {
      plugins: ['jsx', 'typescript'],
      sourceType: 'script',
    })
  } catch (e) {
    try {
      ast = babel.parse(source, {
        plugins: ['jsx', 'typescript'],
        sourceType: 'module',
      })
    } catch (e) {
      if (options.filename) {
        console.error('parse error in file %s', options.filename)
      } else {
        debug('parse error in source code')
      }
      return []
    }
  }

  const attributes = [
    'testId',
    'data-cy',
    'data-test',
    'data-test-id',
    'data-testid',
    'data-testId',
    'dataTestId',
    ...(options.attributes || []),
  ]
  // debug('test attributes to find', attributes)

  const testIds = []

  try {
    traverse(ast, {
      JSXElement(a) {
        // debug('JSXElement')
        // debug(a.node.openingElement.attributes)
        a.node.openingElement.attributes.forEach((node) => {
          if (isTestAttributeNode(attributes, node)) {
            if (node.value.type === 'StringLiteral') {
              const testId = node.value.value
              debug('found test id "%s"', testId)
              testIds.push(testId)
            } else {
              debug(
                'skipping non-string literal for attribute "%s"',
                node.name.name,
              )
            }
          }
        })
      },
    })
  } catch (e) {
    if (options.filename) {
      console.error(
        'finding test attributes: parse error in file %s',
        options.filename,
      )
    } else {
      debug('parse error in source code')
    }
    return []
  }

  return testIds.sort()
}

/**
 * @typedef {Object} FindQueriesOptions
 * @property {string[]?} commands Names of custom commands to look for
 */

/**
 * Parses the given Cypress spec source code and finds all queried test id values.
 * @param {string} source The spec source code
 * @param {FindQueriesOptions} options Options controlling what to look for
 */
function findTestQueries(source, options = {}) {
  const testIds = []

  let ast

  try {
    ast = babel.parse(source, {
      // we allow JSX when looking at Cypress specs
      // because these could be component tests
      plugins: ['typescript', 'jsx'],
      sourceType: 'script',
    })
  } catch (e) {
    try {
      ast = babel.parse(source, {
        plugins: ['typescript', 'jsx'],
        sourceType: 'module',
      })
    } catch (e) {
      debug('another parse error in source code')
      if (options.filename) {
        console.error('parse error in file %s', options.filename)
      }
      return []
    }
  }

  const queryCommands = [...(options.commands || [])]
  debug('query commands to find', queryCommands)

  try {
    traverse(ast, {
      CallExpression(a) {
        // debug('CallExpression')
        if (isCyQueryCommandExpression(a.node)) {
          debug('it is a cy built-in query command')
          if (isCyTestAttributeSelector(a.node.arguments[0])) {
            const testId = extractTestId(a.node.arguments[0].value)
            debug('found query test id "%s"', testId)
            testIds.push(testId)
          }
        } else if (isCyCustomQueryExpression(queryCommands, a.node)) {
          debug('it is a custom query command')
          if (a.node.arguments[0].type === 'StringLiteral') {
            const testId = a.node.arguments[0].value
            debug('found query test id "%s"', testId)
            testIds.push(testId)
          }
        }
      },
    })
  } catch (e) {
    debug('problem traversing the source code')
    if (options.filename) {
      console.error(
        'problem traversing the source code in file %s',
        options.filename,
      )
    }
    return []
  }

  return testIds.sort()
}

/**
 * Finds data test ids used in JSX source file
 * @param {string} filename The filename to read
 */
function findTestAttributesInFile(filename) {
  debug('searching %s', filename)
  const source = fs.readFileSync(filename, 'utf8')

  try {
    return findTestAttributes(source, { filename })
  } catch (e) {
    debug('⚠️ could not parse source code in file %s', filename)
    return []
  }
}

/**
 * Finds data test ids used in JSX source files.
 * The attributes are unique and alphabetically sorted
 * @param {string[]} filenames The filenames to read
 */
function findTestAttributesInFiles(filenames) {
  const names = new Set()
  filenames.forEach((filename) => {
    const ids = findTestAttributesInFile(filename)
    ids.forEach((testId) => {
      names.add(testId)
    })
  })
  const ids = [...names].sort()
  return ids
}

/**
 * Finds data test ids used in JSX source file before and after source change.
 * The attributes are unique and alphabetically sorted
 * @param {string[]} filenames The filenames to read
 */
function findTestAttributesInChangedSourceFiles(changedSources) {
  const names = new Set()
  changedSources.forEach((changedSource) => {
    let ids = findTestAttributes(changedSource.before, {
      filename: changedSource.filename,
    })
    ids.forEach((testId) => {
      names.add(testId)
    })

    ids = findTestAttributes(changedSource.after, {
      filename: changedSource.filename,
    })
    ids.forEach((testId) => {
      names.add(testId)
    })
  })
  const ids = [...names].sort()
  return ids
}

/**
 * Finds data test ids used in the Cypress spec file
 * @param {string} filename The filename to read
 * @param {FindQueriesOptions} options Options controlling what to look for
 */
function findTestQueriesInFile(filename, options = {}) {
  const source = fs.readFileSync(filename, 'utf8')
  try {
    return findTestQueries(source, options)
  } catch (e) {
    debug('⚠️ could not parse spec %s', filename)
    return []
  }
}

/**
 * Finds data test ids used in spec files.
 * The attributes are unique and alphabetically sorted
 * @param {string[]} filenames The spec filenames to read
 * @param {FindQueriesOptions} options Options controlling what to look for
 */
function findTestQueriesInFiles(filenames, options = {}) {
  const names = new Set()

  // each test id is a key, and the value
  // is a list of specs that use that test id
  const testIdToFilenames = {}

  filenames.forEach((filename) => {
    const ids = findTestQueriesInFile(filename, options)
    ids.forEach((testId) => {
      names.add(testId)
      if (!testIdToFilenames[testId]) {
        testIdToFilenames[testId] = [filename]
      } else {
        testIdToFilenames[testId].push(filename)
      }
    })
  })
  const testIds = [...names].sort()
  return { testIds, testIdToFilenames }
}

module.exports = {
  findTestQueries,
  findTestQueriesInFile,
  findTestQueriesInFiles,
  findTestAttributes,
  findTestAttributesInFile,
  findTestAttributesInFiles,
  findTestAttributesInChangedSourceFiles,
}
