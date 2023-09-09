const test = require('ava')
const path = require('path')
const { findTestAttributesInFile } = require('../src')

test('finds test ids in JSX file', (t) => {
  const filename = path.join(__dirname, 'fixtures', 'hello.jsx')
  const found = findTestAttributesInFile(filename)
  t.deepEqual(found, ['greeting'])
})
