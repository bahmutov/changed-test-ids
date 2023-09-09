const test = require('ava')
const { stripIndent } = require('common-tags')
const { findTestQueries } = require('../src')

test('finds custom query command', (t) => {
  const source = stripIndent`
    cy.getByTestId('greeting')
  `
  const found = findTestQueries(source, {
    commands: ['getByTestId'],
  })
  t.deepEqual(found, ['greeting'])
})
