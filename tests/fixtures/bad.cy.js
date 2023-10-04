// this spec has bad syntax on purpose
// the parser should not crash
it('tests', () => {
  cy.getTest('
})
