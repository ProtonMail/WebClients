function test(USERNAME, { confirmModal, welcomeModal }, isFree) {
    it('should only display the main step', () => {
        cy.get('.signUpProcess-step-1').should('be.visible');
        cy.get('.signUpProcess-step-2').should('not.be.visible');
        cy.get('.signUpProcess-step-3').should('not.be.visible');
        cy.get('.signUpProcess-step-4').should('not.be.visible');
        cy.get('.signUpProcess-step-5').should('not.be.visible');
    });

    it('should check if the username is unique', () => {
        cy.get('.signUpProcess-about-success').should('not.be.visible');
        cy.get('.signUpProcess-about-pending').should('not.be.visible');

        cy.get('[ng-model="model.username"]').type('polo');
        cy.get('.signUpProcess-about-pending').should('be.visible');
        cy.get('.signUpProcess-about-pending').contains('Checking username');
        cy.get('[ng-message="alreadyTaken"]').contains('Username already taken');

        cy.get('.signUpProcess-about-success').should('not.be.visible');
        cy.get('.signUpProcess-about-pending').should('not.be.visible');

        cy
            .get('[ng-model="model.username"]')
            .clear()
            .type(USERNAME);
        cy.get('.signUpProcess-about-success').contains('Username available');
        cy.get('[ng-message="alreadyTaken"]').should('not.exist');
        cy.get('.signUpProcess-about-pending').should('not.be.visible');
    });

    it('should check if the password', () => {
        cy.get('#password').type('dew');
        cy.get('#password').clear();
        cy.get('[data-id="password"] .password-messages [ng-message="required"]').contains('Field required');
        cy.get('[data-id="password"] .password-messages [ng-message="compareTo"]').should('not.exist');
        cy.get('#password').type('test');
        cy.get('[data-id="password"] .password-messages [ng-message="required"]').should('not.exist');

        cy.get('#passwordc').type('polo');
        cy.get('[data-id="passwordc"] .password-messages [ng-message="required"]').should('not.exist');
        cy.get('[data-id="passwordc"] .password-messages [ng-message="compareTo"]').contains('Passwords do not match');

        cy.get('#passwordc').clear();
        cy.get('#passwordc').type('test');
        cy.get('#passwordc').blur();
        cy.get('[data-id="passwordc"] .password-messages [ng-message="required"]').should('not.exist');
        cy.get('[data-id="passwordc"] .password-messages [ng-message="compareTo"]').should('not.exist');
    });

    it('should toggle password type', () => {
        cy
            .get('#password')
            .clear()
            .type('dew');
        cy.get('#password').should('have.attr', 'type', 'password');
        cy.get('[data-id="password"] .togglePassword-btn-toggle').click();
        cy.get('#password').should('have.attr', 'type', 'text');
        cy.get('[data-id="password"] .togglePassword-btn-toggle').click();
        cy.get('#password').should('have.attr', 'type', 'password');

        cy
            .get('#passwordc')
            .clear()
            .type('dew');
        cy.get('#passwordc').should('have.attr', 'type', 'password');
        cy.get('[data-id="passwordc"] .togglePassword-btn-toggle').click();
        cy.get('#passwordc').should('have.attr', 'type', 'text');
        cy.get('[data-id="passwordc"] .togglePassword-btn-toggle').click();
        cy.get('#passwordc').should('have.attr', 'type', 'password');
    });

    it('should open a warning modal if no notificationEmail', () => {
        confirmModal.isOpen(false);

        cy.get('.signUpProcess-btn-create').click();
        confirmModal.isOpen();

        confirmModal.close();
        confirmModal.isOpen(false);

        cy.get('.signUpProcess-btn-create').click();
        confirmModal.isOpen();
        confirmModal.closeCross();
        confirmModal.isOpen(false);
    });

    if (isFree) {
        it('should not open a warning modal if no notificationEmail', () => {
            cy.get('#notificationEmail').type(USERNAME + 1 + '@protonmail.com');
            cy.get('.signUpProcess-btn-create').click();
            confirmModal.isOpen(false);
        });

        it('should display the generating step on submit', () => {
            cy.get('.signUpProcess-step-1').should('not.be.visible');
            cy.get('.signUpProcess-step-2').should('be.visible');
            cy.get('.signUpProcess-step-3').should('not.be.visible');
            cy.get('.signUpProcess-step-4').should('not.be.visible');
            cy.get('.signUpProcess-step-5').should('not.be.visible');

            cy.wait(500);

            cy.get('.signUpProcess-step-1').should('not.be.visible');
            cy.get('.signUpProcess-step-2').should('not.be.visible');
            cy.get('.signUpProcess-step-3').should('be.visible');
            cy.get('.signUpProcess-step-4').should('not.be.visible');
            cy.get('.signUpProcess-step-5').should('not.be.visible');
        });
        return;
    }

    it('should display the generating step on submit', () => {
        cy.get('.signUpProcess-btn-create').click();
        confirmModal.submit();

        cy.get('.signUpProcess-step-1').should('not.be.visible');
        cy.get('.signUpProcess-step-2').should('be.visible');
        cy.get('.signUpProcess-step-3').should('not.be.visible');
        cy.get('.signUpProcess-step-4').should('not.be.visible');
        cy.get('.signUpProcess-step-5').should('not.be.visible');

        cy.wait(500);

        cy.get('.signUpProcess-step-1').should('not.be.visible');
        cy.get('.signUpProcess-step-2').should('not.be.visible');
        cy.get('.signUpProcess-step-3').should('not.be.visible');
        cy.get('.signUpProcess-step-4').should('be.visible');
        cy.get('.signUpProcess-step-5').should('not.be.visible');
    });
}

module.exports = test;
