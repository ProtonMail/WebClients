describe('Connect a user', () => {
    it('Login single password', () => {
        cy.login();
        cy.logout();
    });

    it('Login single password + unlock', () => {
        cy.login(true);
        cy.logout();
    });
});
