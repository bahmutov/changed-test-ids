const test = require('ava')
const { stripIndent } = require('common-tags')
const { findTestQueries } = require('../src')

test('skips variable value', (t) => {
  const source = stripIndent`
    const id = 'greeting'
    cy.getByTestId(id)
  `
  const found = findTestQueries(source, {
    commands: ['getByTestId'],
  })
  t.deepEqual(found, [])
})
