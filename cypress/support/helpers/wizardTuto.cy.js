const selector = (item) => cy.get(`#pm_wizard ${item}`);
const visibility = (test = true) => `${test ? '' : 'not.'}be.visible`.trim();

const isOpen = (test = true) => {
    if (!test) {
        return selector().should('not.be.visible');
    }
    selector().should('not.be.visible');
};

const isStep = (step = 1) => {
    cy.get(`.wizardStep-1`).should(visibility(step === 1));
    cy.get(`.wizardStep-2`).should(visibility(step === 2));
    cy.get(`.wizardStep-3`).should(visibility(step === 3));
    cy.get(`.wizardStep-4`).should(visibility(step === 4));
    selector('[data-display-wizard-button="tourNext"]').should(visibility(step !== 4));
    selector('[data-display-wizard-button="tourEnd"]').should(visibility(step === 4));
};

const close = (step) => {
    selector('[data-display-wizard-button="tourEnd"]:first-of-type').click();
    isOpen(false);
};

const next = (step) => {
    selector('[data-display-wizard-button="tourNext"]').click();
};

const tour = (step) => {
    selector('[data-display-wizard-button="tourGo"][data-display-position="${step}"]').click();
};

module.exports = {
    isOpen,
    isStep,
    close,
    next,
    tour
};
