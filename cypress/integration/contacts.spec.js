const hookBefore = () => {
    before(() => {
        cy.login();
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

test('Merge contacts', () => require('../fixtures/contacts/mergeContacts.spec.js'))
test('Add, remove, edit, and compose to contacts', () => require('../fixtures/contacts/addRemoveEditCompose.spec.js'));
