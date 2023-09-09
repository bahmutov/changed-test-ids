const test = require('ava')
const path = require('path')
const { findTestQueriesInFile } = require('../src')

test('finds test ids in the spec file', (t) => {
  const filename = path.join(__dirname, 'fixtures', 'hello.cy.js')
  const found = findTestQueriesInFile(filename, {
    commands: ['getTest'],
  })
  t.deepEqual(found, ['greeting'])
})
