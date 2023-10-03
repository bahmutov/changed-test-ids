const test = require('ava')
const { stripIndent } = require('common-tags')
const { findTestQueries } = require('../src')

test('finds custom query command in typescript source', (t) => {
  const source = stripIndent`
    const n: number = 1;
    cy.getByTestId('greeting')
  `
  const found = findTestQueries(source, {
    commands: ['getByTestId'],
  })
  t.deepEqual(found, ['greeting'])
})

test('finds custom query command in typescript module source', (t) => {
  const source = stripIndent`
    import {n} from './constants'
    cy.getByTestId('greeting')
  `
  const found = findTestQueries(source, {
    commands: ['getByTestId'],
  })
  t.deepEqual(found, ['greeting'])
})
