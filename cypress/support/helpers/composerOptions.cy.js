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

const helper = () => {
    const composeBtnSelectr = '.sidebar-btn-compose';
    const containerSelector = '.composer-container';
    const headerSelector = '.composerHeader-container';
    const headerButtonSelectors = {
        exitFullscreen: '.composer-action-maximize[pt-tooltip="Exit fullscreen"',
        fullscreen: '.composer-action-maximize[pt-tooltip="Fullscreen"',
        close: '.composer-action-close'
    };
    const moreOptionsDropdownSelector = '.squireToolbar-action-modeEditor';
    const composerModeSelector = '.squireToolbar-select-item:has( > span[translate-context="Composer Mode"])';
    const composerTextDirectionSelector = '.squireToolbar-select-item:has( > span[translate-context="Option"])';

    const open = () => {
        cy.get(composeBtnSelectr).click();
        return isOpen();
    };

    const close = () => {
        cy.get(headerButtonSelectors.close).click();
        return isOpen(false);
    };

    const isOpen = (open = true) => {
        if (open) {
            return cy.get(containerSelector).should('be.visible');
        }
        return cy.get(containerSelector).should('not.be.visible');
    };

    const maximize = () => {
        cy.get(headerButtonSelectors.fullscreen).click();
        return isMaximized();
    };

    const isMaximized = (shouldBeMaximised = true) => {
        if (shouldBeMaximised) {
            return cy.get(headerButtonSelectors.exitFullscreen).should('be.visible');
        }
        return cy.get(headerButtonSelectors.exitFullscreen).should('not.be.visible');
    };

    const isComposerOptionActive = (name = null, selector = null) => {
        cy.get(moreOptionsDropdownSelector).click();

        cy.get(selector).each((el) => {
            let element = cy.wrap(el);
            element.invoke('text').then((text) => {
                let selectedElement = cy.wrap(el);
                if (name.trim() == text.trim()) {
                    selectedElement.within(() => {
                        cy.get('.fa-check')
                            .should('have.css', 'opacity')
                            .and('match', /1/);
                    });
                } else {
                    selectedElement.within(() => {
                        cy.get('.fa-check')
                            .should('have.css', 'opacity')
                            .and('match', /0/);
                    });
                }
            });
        });
    };

    const isPlaintextMode = (shouldBe = true) => {
        if (!shouldBe) {
            return isNormalMode(true);
        }
        return isComposerOptionActive('Plain Text', composerModeSelector);
    };

    const isNormalMode = (shouldBe = true) => {
        if (!shouldBe) {
            return isPlaintextMode(true);
        }
        return isComposerOptionActive('Normal', composerModeSelector);
    };

    const isRightToLeft = (shouldBe = true) => {
        if (!shouldBe) {
            return isLeftToRight(true);
        }

        return isComposerOptionActive('Right to Left', composerTextDirectionSelector);
    };

    const isLeftToRight = (shouldBe = true) => {
        if (!shouldBe) {
            return isRightToLeft(true);
        }
        return isComposerOptionActive('Left to Right', composerTextDirectionSelector);
    };

    return {
        open,
        close,
        isOpen,
        maximize,
        isMaximized,
        isPlaintextMode,
        isNormalMode,
        isLeftToRight,
        isRightToLeft
    };
};

module.exports = { expiration, encrypt, helper };
