const test = require('ava')
const path = require('path')
const { findTestAttributesInFile } = require('../src')

test('finds test ids in TSX file', (t) => {
  const filename = path.join(__dirname, 'fixtures', 'address.tsx')
  const found = findTestAttributesInFile(filename)
  t.deepEqual(found, ['street'])
})
