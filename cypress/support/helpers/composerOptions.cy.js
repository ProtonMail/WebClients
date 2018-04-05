const main = (scope) => (item = '') => `${scope} ${item}`.trim();

const expiration = () => {
    const selector = main('.composerExpiration-container');

    const open = () => {
        it('should open the panel to set an expiration date', () => {
            cy.get('.composer-btn-expiration').should('not.have.class', 'primary');
            cy.get(selector()).should('not.be.visible');
            cy.get('.composer-btn-expiration').click();
            cy.get(selector()).should('be.visible');
        });
    };

    const cancel = () => {
        it('should hide the panel on cancel', () => {
            cy.get(selector()).should('be.visible');
            cy.get(selector('.composerExpiration-btn-cancel')).click();
            cy.get(selector()).should('not.be.visible');
            cy.get('.composer-btn-expiration').should('not.have.class', 'primary');
        });
    };

    const set = () => {
        it('should save options and set a state on the button', () => {
            cy.get(selector()).should('be.visible');
            cy.get(selector('.composerExpiration-btn-submit')).click();
            cy.get(selector()).should('not.be.visible');
            cy.get('.composer-btn-expiration').should('have.class', 'primary');
        });
    };

    const select = (type) => (number) => {
        it(`should select the option for ${type}`, () => {
            const item = selector(`[name="${type}"]`);
            cy.selectOption(number, item);
        });
    };

    const addWeeks = select('weeks');
    const addDays = select('days');
    const addHours = select('hours');

    return {
        open,
        cancel,
        set,
        addWeeks,
        addDays,
        addHours
    };
};

const encrypt = () => {
    const selector = main('.composer-options-encryption');

    const open = () => {
        it('should open the panelencryption', () => {
            cy.get('.composer-btn-encryption').should('not.have.class', 'primary');
            cy.get(selector()).should('not.be.visible');
            cy.get('.composer-btn-encryption').click();
            cy.get(selector()).should('be.visible');
        });
    };

    const cancel = () => {
        it('should hide the panel on cancel', () => {
            cy.get(selector()).should('be.visible');
            cy.get(selector('.composerEncrypt-btn-cancel')).click();
            cy.get(selector()).should('not.be.visible');
            cy.get('.composer-btn-encryption').should('not.have.class', 'primary');
        });
    };

    const set = () => {
        it('should save options and set a state on the button', () => {
            cy.get(selector()).should('be.visible');
            cy.get(selector('.composerEncrypt-btn-submit')).click();
            cy.get(selector()).should('not.be.visible');
            cy.get('.composer-btn-encryption').should('have.class', 'primary');
        });
    };

    const fillInputs = ({ name = 'monique', confirm = 'monique', hint = 'monique' } = {}) => {
        it('should focus the first input', () => {
            cy.focused().should('have.attr', 'name', 'outsidePw');
            cy.focused().should('have.value', '');
        });

        it('should fill the input', () => {
            cy.focused().type(name);
        });

        it('should fill the input confirm', () => {
            cy.get('[name="outsidePwConfirm"]').type(confirm);
        });

        if (!hint) {
            return;
        }

        it('should fill the hint', () => {
            cy.get('[name="outsidePwHint"]').type(hint);
        });
    };

    return {
        open,
        cancel,
        set,
        fillInputs
    };
};

module.exports = { expiration, encrypt };
