const test = require('ava')
const { stripIndent } = require('common-tags')
const { findTestQueries } = require('../src')

test('supports JSX for component tests', (t) => {
  const source = stripIndent`
    cy.mount(<div>Hello</div>)
    cy.get('[data-test=greeting]')
      .find('[data-test=person]')
  `
  const found = findTestQueries(source)
  t.deepEqual(found, ['greeting', 'person'])
})
