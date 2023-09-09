const test = require('ava')
const { stripIndent } = require('common-tags')
const { findTestAttributes } = require('../src')

test('finds testId', (t) => {
  const source = stripIndent`
    <div testId="greeting">Hello</div>
  `
  const found = findTestAttributes(source)
  t.deepEqual(found, ['greeting'])
})

test('finds data-cy', (t) => {
  const source = stripIndent`
    <div data-cy="greeting">Hello</div>
  `
  const found = findTestAttributes(source)
  t.deepEqual(found, ['greeting'])
})

test('finds data-test', (t) => {
  const source = stripIndent`
    <div data-test="greeting">Hello</div>
  `
  const found = findTestAttributes(source)
  t.deepEqual(found, ['greeting'])
})

test('finds data-test-id', (t) => {
  const source = stripIndent`
    <div data-test-id="greeting">Hello</div>
  `
  const found = findTestAttributes(source)
  t.deepEqual(found, ['greeting'])
})

test('finds data-testId', (t) => {
  const source = stripIndent`
    <div data-testId="greeting">Hello</div>
  `
  const found = findTestAttributes(source)
  t.deepEqual(found, ['greeting'])
})
