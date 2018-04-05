const hookBefore = () => {
    before(() => {
        cy.login();
        cy.compose();
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

describe('Composer', () => {
    test('Save and delete draft', () => require('../fixtures/composer/saveAndDeleteDraft.spec'));
    test('Default behavior', () => require('../fixtures/composer/behavior.spec'));
    test('Simple message with subject', () => require('../fixtures/composer/simpleMessage.spec'));
    test('Without a subject/recipient/invalid', () => require('../fixtures/composer/noSubject.spec'));
    test('Editor', () => require('../fixtures/composer/editor.spec'));
    test('Media', () => require('../fixtures/composer/media.spec'));
    test('Encrypt message', () => require('../fixtures/composer/encrypt.spec'));
    test('Expiration message', () => require('../fixtures/composer/expiration.spec'));
});
