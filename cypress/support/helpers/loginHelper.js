const hookBefore = (beforeAction) => {
    before(() => {
        cy.login();
        beforeAction();
    });
};

const hookAfter = (afterAction) => {
    after(() => {
        afterAction();
        cy.logout();
    });
};

const test = (subject, cb, before, after) => {
    describe(subject, () => {
        hookBefore(before);
        cb();
        hookAfter(after);
    });
};

module.exports = (name, cb, beforeAction = () => {}, afterAction = () => {}) =>
    test(`${name}`, cb, beforeAction, afterAction);
