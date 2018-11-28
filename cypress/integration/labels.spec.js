const hookBefore = () => {
    before(() => {
        cy.login(false, Cypress.env('labelUser'));
    });
};

const hookAfter = () => {
    after(() => cy.logout());
};

const test = (subject, cb) => {
    describe(subject, () => {
        hookBefore();
        cb();
        hookAfter();
    });
};

test('Edit labels via toolbar', () => require('../fixtures/labels/editLabel.spec'));
test('Edit folders via toolbar', () => require('../fixtures/labels/editFolder.spec'));
test('No labels', () => require('../fixtures/labels/noLabels.spec'));
