const test = require('ava')
const path = require('path')
const { findTestAttributesInFiles } = require('../src')

test('finds test ids in JSX files', (t) => {
  const filenames = [
    path.join(__dirname, 'fixtures', 'hello.jsx'),
    path.join(__dirname, 'fixtures', 'person.jsx'),
  ]
  const found = findTestAttributesInFiles(filenames)
  t.deepEqual(found, ['greeting', 'name'])
})
