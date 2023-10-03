// @ts-ignore
it('tests', () => {
  const n: boolean = true
  // @ts-ignore
  cy.getTest('people').should('have.text', 'hello')
})
