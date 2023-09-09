it('tests', () => {
  cy.getTest('greeting').should('have.text', 'hello')
})
