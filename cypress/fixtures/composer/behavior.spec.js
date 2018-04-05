const message = require('./message.config');
const autocompleteTest = require('../../support/helpers/autocomplete.cy');
const { hexToRgb } = require('../../support/helpers/string.cy');

const toListInput = autocompleteTest('.composer-field-ToList');
const ccListInput = autocompleteTest('.composer-field-CCList');
const bccListInput = autocompleteTest('.composer-field-BCCList');

// Doesn't work on the headless browser
// it('should focus the composer To filed', () => {
//     cy.wait(300);
//     cy.focused().should('have.attr', 'id', 'autocomplete');
// });

it('should hide the 2sd toolbar', () => {
    cy.get('.squireToolbar-row-2').should('not.be.visible');
});

it('should toggle the 2sd toolbar', () => {
    cy.get('.squireToolbar-action-options').click();
    cy.get('.squireToolbar-row-2').should('be.visible');
});

describe('Color popover', () => {
    it('should toggle the popover', () => {
        cy.get('.squireSelectColor-popover').should('not.be.visible');
        cy.get('.squireToolbar-action-color').click();
        cy.get('.squireSelectColor-popover').should('be.visible');
        cy.get('.squireToolbar-action-color').click();
        cy.get('.squireSelectColor-popover').should('not.be.visible');
    });

    it('should not close the 2sd toolbar', () => {
        cy.get('.squireToolbar-action-color').click();
        cy.get('.squireToolbar-row-2').should('be.visible');
        cy.get('.squireToolbar-action-color').click();
        cy.get('.squireToolbar-row-2').should('be.visible');
    });

    it('should update the selected color', () => {
        cy.get('.squireToolbar-action-color').click();

        cy
            .get(`[data-mode="color"] .colorList-btn-choose[data-color="${hexToRgb('#3B83C2')}"]`)
            .should('not.have.class', 'active');
        cy
            .get(`[data-mode="color"] .colorList-btn-choose[data-color="${hexToRgb('#FFFFFF')}"]`)
            .should('not.have.class', 'active');
        cy
            .get(`[data-mode="color"] .colorList-btn-choose[data-color="${hexToRgb('#222222')}"]`)
            .should('have.class', 'active');

        cy.get(`[data-mode="color"] .colorList-btn-choose[data-color="${hexToRgb('#FFFFFF')}"]`).click();
        cy.get('.squireSelectColor-popover').should('not.be.visible');
        cy.get('.squireToolbar-action-color mark').should('have.attr', 'style', 'color: rgb(255, 255, 255);');

        cy.get('.squireToolbar-action-color').click();
        cy
            .get(`[data-mode="color"] .colorList-btn-choose[data-color="${hexToRgb('#3B83C2')}"]`)
            .should('not.have.class', 'active');
        cy
            .get(`[data-mode="color"] .colorList-btn-choose[data-color="${hexToRgb('#FFFFFF')}"]`)
            .should('have.class', 'active');
        cy
            .get(`[data-mode="color"] .colorList-btn-choose[data-color="${hexToRgb('#222222')}"]`)
            .should('not.have.class', 'active');

        cy.get(`[data-mode="color"] .colorList-btn-choose[data-color="${hexToRgb('#3B83C2')}"]`).click();
        cy.get('.squireSelectColor-popover').should('not.be.visible');
        cy.get('.squireToolbar-action-color mark').should('have.attr', 'style', 'color: rgb(59, 131, 194);');

        cy.get('.squireToolbar-action-color').click();
        cy
            .get(`[data-mode="color"] .colorList-btn-choose[data-color="${hexToRgb('#3B83C2')}"]`)
            .should('have.class', 'active');
        cy
            .get(`[data-mode="color"] .colorList-btn-choose[data-color="${hexToRgb('#FFFFFF')}"]`)
            .should('not.have.class', 'active');
        cy
            .get(`[data-mode="color"] .colorList-btn-choose[data-color="${hexToRgb('#222222')}"]`)
            .should('not.have.class', 'active');
        cy.get('.squireToolbar-action-color').click();
        cy.get('.squireSelectColor-popover').should('not.be.visible');
    });

    describe('Hide popover', () => {
        beforeEach(() => {
            cy.get('.squireToolbar-action-color').click();
            cy.get('.squireSelectColor-popover').should('be.visible');
        });

        it('should hide the popover if click select options', () => {
            cy.get('.squireToolbar-action-modeEditor').click();
            cy.get('.squireSelectColor-popover').should('not.be.visible');
        });

        it('should hide the popover if click select font size', () => {
            cy.get('.squireToolbar-action-fontSize').click();
            cy.get('.squireSelectColor-popover').should('not.be.visible');
        });

        it('should hide the popover if click select font family', () => {
            cy.get('.squireToolbar-action-fontFamily').click();
            cy.get('.squireSelectColor-popover').should('not.be.visible');
        });

        it('should hide the popover if click select other button', () => {
            cy.get('.squireToolbar-action-removeAllFormatting').click();
            cy.get('.squireSelectColor-popover').should('not.be.visible');
        });

        it('should hide the popover if toggle toolbar', () => {
            cy.get('.squireToolbar-action-options').click();
            cy.get('.squireToolbar-row-2').should('not.be.visible');
            cy.get('.squireToolbar-action-options').click();
            cy.get('.squireToolbar-row-2').should('be.visible');
            cy.get('.squireSelectColor-popover').should('not.be.visible');
        });
    });
});

describe('Font size select', () => {
    it('should toggle the select', () => {
        cy.get('.squireToolbar-font-size').should('not.be.visible');
        cy.get('.squireToolbar-action-fontSize').click();
        cy.get('.squireToolbar-font-size').should('be.visible');
        cy.get('.squireToolbar-action-fontSize').click();
        cy.get('.squireToolbar-font-size').should('not.be.visible');
    });

    it('should not close the 2sd toolbar', () => {
        cy.get('.squireToolbar-action-fontSize').click();
        cy.get('.squireToolbar-row-2').should('be.visible');
        cy.get('.squireToolbar-action-fontSize').click();
        cy.get('.squireToolbar-row-2').should('be.visible');
    });

    describe('Hide popover', () => {
        beforeEach(() => {
            cy.get('.squireToolbar-action-fontSize').click();
            cy.get('.squireToolbar-font-size').should('be.visible');
        });

        it('should hide the popover if click select options', () => {
            cy.get('.squireToolbar-action-modeEditor').click();
            cy.get('.squireToolbar-font-size').should('not.be.visible');
        });

        it('should hide the popover if click button color', () => {
            cy.get('.squireToolbar-action-color').click();
            cy.get('.squireToolbar-font-size').should('not.be.visible');
        });

        it('should hide the popover if click select font family', () => {
            cy.get('.squireToolbar-action-fontFamily').click();
            cy.get('.squireToolbar-font-size').should('not.be.visible');
        });

        it('should hide the popover if click select other button', () => {
            cy.get('.squireToolbar-action-removeAllFormatting').click();
            cy.get('.squireToolbar-font-size').should('not.be.visible');
        });

        it('should hide the popover if toggle toolbar', () => {
            cy.get('.squireToolbar-action-options').click();
            cy.get('.squireToolbar-row-2').should('not.be.visible');
            cy.get('.squireToolbar-action-options').click();
            cy.get('.squireToolbar-row-2').should('be.visible');
            cy.get('.squireToolbar-font-size').should('not.be.visible');
        });
    });
});

describe('Font family select', () => {
    it('should toggle the select', () => {
        cy.get('.squireToolbar-font-family').should('not.be.visible');
        cy.get('.squireToolbar-action-fontFamily').click();
        cy.get('.squireToolbar-font-family').should('be.visible');
        cy.get('.squireToolbar-action-fontFamily').click();
        cy.get('.squireToolbar-font-family').should('not.be.visible');
    });

    it('should not close the 2sd toolbar', () => {
        cy.get('.squireToolbar-action-fontFamily').click();
        cy.get('.squireToolbar-row-2').should('be.visible');
        cy.get('.squireToolbar-action-fontFamily').click();
        cy.get('.squireToolbar-row-2').should('be.visible');
    });

    describe('Hide popover', () => {
        beforeEach(() => {
            cy.get('.squireToolbar-action-fontFamily').click();
            cy.get('.squireToolbar-font-family').should('be.visible');
        });

        it('should hide the popover if click select options', () => {
            cy.get('.squireToolbar-action-modeEditor').click();
            cy.get('.squireToolbar-font-family').should('not.be.visible');
        });

        it('should hide the popover if click button color', () => {
            cy.get('.squireToolbar-action-color').click();
            cy.get('.squireToolbar-font-family').should('not.be.visible');
        });

        it('should hide the popover if click select font size', () => {
            cy.get('.squireToolbar-action-fontSize').click();
            cy.get('.squireToolbar-font-family').should('not.be.visible');
        });

        it('should hide the popover if click select other button', () => {
            cy.get('.squireToolbar-action-removeAllFormatting').click();
            cy.get('.squireToolbar-font-family').should('not.be.visible');
        });

        it('should hide the popover if toggle toolbar', () => {
            cy.get('.squireToolbar-action-options').click();
            cy.get('.squireToolbar-row-2').should('not.be.visible');
            cy.get('.squireToolbar-action-options').click();
            cy.get('.squireToolbar-row-2').should('be.visible');
            cy.get('.squireToolbar-font-family').should('not.be.visible');
        });
    });
});

describe('Options select', () => {
    it('should toggle the select', () => {
        cy.get('.squireToolbar-editor-mode').should('not.be.visible');
        cy.get('.squireToolbar-action-modeEditor').click();
        cy.get('.squireToolbar-editor-mode').should('be.visible');
        cy.get('.squireToolbar-action-modeEditor').click();
        cy.get('.squireToolbar-editor-mode').should('not.be.visible');
    });

    it('should not close the 2sd toolbar', () => {
        cy.get('.squireToolbar-action-modeEditor').click();
        cy.get('.squireToolbar-row-2').should('be.visible');
        cy.get('.squireToolbar-action-modeEditor').click();
        cy.get('.squireToolbar-row-2').should('be.visible');
    });

    describe('Hide popover', () => {
        beforeEach(() => {
            cy.get('.squireToolbar-action-modeEditor').click();
            cy.get('.squireToolbar-editor-mode').should('be.visible');
        });

        it('should hide the color popover if click font family', () => {
            cy.get('.squireToolbar-action-fontFamily').click();
            cy.get('.squireToolbar-editor-mode').should('not.be.visible');
        });

        it('should hide the popover if click button color', () => {
            cy.get('.squireToolbar-action-color').click();
            cy.get('.squireToolbar-editor-mode').should('not.be.visible');
        });

        it('should hide the popover if click select font size', () => {
            cy.get('.squireToolbar-action-fontSize').click();
            cy.get('.squireToolbar-editor-mode').should('not.be.visible');
        });

        it('should hide the popover if click select other button', () => {
            cy.get('.squireToolbar-action-removeAllFormatting').click();
            cy.get('.squireToolbar-editor-mode').should('not.be.visible');
        });

        it('should hide the popover if click select other button', () => {
            cy.get('.squireToolbar-action-removeAllFormatting').click();
            cy.get('.squireToolbar-editor-mode').should('not.be.visible');
        });

        it('should hide the popover if toggle toolbar', () => {
            cy.get('.squireToolbar-action-options').click();
            cy.get('.squireToolbar-row-2').should('not.be.visible');
            cy.get('.squireToolbar-action-options').click();
            cy.get('.squireToolbar-row-2').should('be.visible');
            cy.get('.squireToolbar-editor-mode').should('not.be.visible');
        });
    });
});

describe('popover link', () => {
    it('should toggle the popover', () => {
        cy.get('.addLinkPopover-container').should('not.be.visible');
        cy.get('.squireToolbar-action-link').click();
        cy.get('.addLinkPopover-container').should('be.visible');
        cy.get('.squireToolbar-action-link').click();
        cy.get('.addLinkPopover-container').should('not.be.visible');
    });

    it('should close the 2sd row if open', () => {
        cy.get('.squireToolbar-action-options').click();
        cy.get('.squireToolbar-row-2').should('be.visible');

        cy.get('.squireToolbar-action-link').click();
        cy.get('.addLinkPopover-container').should('be.visible');
        cy.get('.squireToolbar-row-2').should('not.be.visible');

        cy.get('.squireToolbar-action-link').click();
        cy.get('.addLinkPopover-container').should('not.be.visible');
        cy.get('.squireToolbar-row-2').should('not.be.visible');
    });

    describe('Hide popover', () => {
        beforeEach(() => {
            cy.get('.squireToolbar-action-link').click();
            cy.get('.addLinkPopover-container').should('be.visible');
        });

        it('should hide the popover if click select other button', () => {
            cy.get('.squireToolbar-action-removeAllFormatting').click();
            cy.get('.addLinkPopover-container').should('not.be.visible');
        });

        it('should hide the popover if click select other button', () => {
            cy.get('.squireToolbar-action-image').click();
            cy.get('.addLinkPopover-container').should('not.be.visible');
            cy.get('.addFilePopover-container').should('be.visible');
        });

        it('should hide the popover if toggle toolbar', () => {
            cy.get('.squireToolbar-action-options').click();
            cy.get('.squireToolbar-row-2').should('be.visible');
            cy.get('.addLinkPopover-container').should('not.be.visible');

            cy.get('.squireToolbar-action-options').click();
            cy.get('.squireToolbar-row-2').should('not.be.visible');
            cy.get('.addLinkPopover-container').should('not.be.visible');
        });
    });
});

describe('popover image', () => {
    it('should toggle the popover', () => {
        cy.get('.addFilePopover-container').should('not.be.visible');
        cy.get('.squireToolbar-action-image').click();
        cy.get('.addFilePopover-container').should('be.visible');
        cy.get('.squireToolbar-action-image').click();
        cy.get('.addFilePopover-container').should('not.be.visible');
    });

    it('should close the 2sd row if open', () => {
        cy.get('.squireToolbar-action-options').click();
        cy.get('.squireToolbar-row-2').should('be.visible');

        cy.get('.squireToolbar-action-image').click();
        cy.get('.addFilePopover-container').should('be.visible');
        cy.get('.squireToolbar-row-2').should('not.be.visible');

        cy.get('.squireToolbar-action-image').click();
        cy.get('.addFilePopover-container').should('not.be.visible');
        cy.get('.squireToolbar-row-2').should('not.be.visible');
    });

    describe('Hide popover', () => {
        beforeEach(() => {
            cy.get('.squireToolbar-action-image').click();
            cy.get('.addFilePopover-container').should('be.visible');
        });

        it('should hide the popover if click select other button', () => {
            cy.get('.squireToolbar-action-removeAllFormatting').click();
            cy.get('.addFilePopover-container').should('not.be.visible');
        });

        it('should hide the popover if click select other button', () => {
            cy.get('.squireToolbar-action-link').click();
            cy.get('.addFilePopover-container').should('not.be.visible');
            cy.get('.addLinkPopover-container').should('be.visible');
        });

        it('should hide the popover if toggle toolbar', () => {
            cy.get('.squireToolbar-action-options').click();
            cy.get('.squireToolbar-row-2').should('be.visible');
            cy.get('.addFilePopover-container').should('not.be.visible');

            cy.get('.squireToolbar-action-options').click();
            cy.get('.squireToolbar-row-2').should('not.be.visible');
            cy.get('.addFilePopover-container').should('not.be.visible');
        });
    });
});

describe('Test autocomplete ToList', () => {
    it('should create a default autocomplete domain', () => {
        toListInput.defaultDomains();
    });

    it('should autocomplete toList', () => {
        toListInput.fill(Cypress.env('login1'), message.ToList);
    });

    it('should remove autocompleted item', () => {
        toListInput.remove(message.ToList);
    });
});

describe('Compose meta options', () => {
    it('should not show CCList/BCCList', () => {
        cy.get('.composer-field-CCList').should('not.be.visible');
        cy.get('.composer-field-BCCList').should('not.be.visible');
    });

    it('should toggle CCList/BCCList', () => {
        cy.get('.composer-field-ToList .composerInputMeta-overlay-button').click();
        cy.get('.composer-field-CCList').should('be.visible');
        cy.get('.composer-field-BCCList').should('be.visible');

        cy.get('.composer-field-ToList .composerInputMeta-overlay-button').click();
        cy.get('.composer-field-CCList').should('not.be.visible');
        cy.get('.composer-field-BCCList').should('not.be.visible');

        cy.get('.composer-field-ToList .composerInputMeta-overlay-button').click();
        cy.get('.composer-field-CCList').should('be.visible');
        cy.get('.composer-field-BCCList').should('be.visible');
    });
});

describe('Test autocomplete CCList', () => {
    const USERNAME = `${Cypress.env('login1')}+roberto`;

    it('should autocomplete toList', () => {
        ccListInput.fill(USERNAME, message.CCList);
    });

    it('should remove autocompleted item', () => {
        ccListInput.remove(message.CCList);
    });
});

describe('Test autocomplete BCCList', () => {
    const USERNAME = `${Cypress.env('login1')}+monique`;

    it('should autocomplete toList', () => {
        bccListInput.fill(USERNAME, message.BCCList);
    });

    it('should remove autocompleted item', () => {
        bccListInput.remove(message.BCCList);
    });
});

describe('Compose size', () => {
    const FULLSCREEN = '.composer-action-maximize[ng-show="!!!message.maximized"]';
    const EXIT_FULLSCREEN = '.composer-action-maximize[ng-show="!!message.maximized"]';

    it('should not be maximized nor minimized', () => {
        cy.get('.composer').should('not.have.class', 'maximized');
        cy.get('.composer').should('not.have.class', 'minimized');
    });

    it('should toggle maximized', () => {
        cy.get(EXIT_FULLSCREEN).should('not.be.visible');

        cy.get(FULLSCREEN).click();
        cy.get('.composer').should('have.class', 'maximized');
        cy.get('.composer').should('not.have.class', 'minimized');
        cy.get(FULLSCREEN).should('not.be.visible');
        cy.get(EXIT_FULLSCREEN).should('be.visible');

        cy.get(EXIT_FULLSCREEN).click();
        cy.get('.composer').should('not.have.class', 'maximized');
        cy.get('.composer').should('not.have.class', 'minimized');
        cy.get(FULLSCREEN).should('be.visible');
        cy.get(EXIT_FULLSCREEN).should('not.be.visible');
    });

    it('should toggle minimized', () => {
        cy.get('.composer-action-minimize').click();
        cy.get('.composer').should('not.have.class', 'maximized');
        cy.get('.composer').should('have.class', 'minimized');
        cy.get('.composer-action-expand').should('be.visible');
        cy.get('.composer-action-minimize').should('not.be.visible');

        cy.get('.composer-action-expand').click();
        cy.get('.composer').should('not.have.class', 'minimized');
        cy.get('.composer').should('not.have.class', 'maximized');
        cy.get('.composer-action-expand').should('not.be.visible');
        cy.get('.composer-action-minimize').should('be.visible');
    });

    it('should resize after max -> min', () => {
        cy.get(FULLSCREEN).click();
        cy.get('.composer').should('have.class', 'maximized');
        cy.get('.composer').should('not.have.class', 'minimized');

        cy.get('.composer-action-minimize').click();
        cy.get('.composer').should('not.have.class', 'maximized');
        cy.get('.composer').should('have.class', 'minimized');

        cy.get(EXIT_FULLSCREEN).should('not.be.visible');
        cy.get(FULLSCREEN).should('be.visible');
        cy.get('.composer-action-expand').should('be.visible');
        cy.get('.composer-action-minimize').should('not.be.visible');

        cy.get('.composer-action-expand').click();
        cy.deleteDraft();
    });
});
