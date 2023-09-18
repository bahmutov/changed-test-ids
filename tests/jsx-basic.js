const test = require('ava')
const { stripIndent } = require('common-tags')
const { findTestAttributes } = require('../src')

test('finds no test id attributes', (t) => {
  const source = stripIndent`
    <div>Hello</div>
  `
  const found = findTestAttributes(source)
  t.deepEqual(found, [])
})

test('finds one test id attribute', (t) => {
  const source = stripIndent`
    <div testId="greeting">Hello</div>
  `
  const found = findTestAttributes(source)
  t.deepEqual(found, ['greeting'])
})

test('finds two test id attributes', (t) => {
  const source = stripIndent`
    <>
      <div testId="greeting">Hello</div>
      <div testId="count">2</div>
    </>
  `
  const found = findTestAttributes(source)
  // the list is sorted alphabetically
  t.deepEqual(found, ['count', 'greeting'])
})

test('ignores dynamic attributes', (t) => {
  const source = stripIndent`
    const testId = 'something';
    <div testId={testId}>Hello</div>
  `
  const found = findTestAttributes(source)
  t.deepEqual(found, [])
})
