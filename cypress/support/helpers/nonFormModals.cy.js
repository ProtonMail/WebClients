function test({ type = 'confirmForm', title, message }) {
    const main = `.modal-dialog[name="${type}"]`;
    const selector = (item = '') => cy.get(`${main} ${item}`.trim());

    const isOpen = (test = true) => {
        if (!test) {
            return selector().should('not.exist');
        }

        selector().should('exist');
        selector('.modal-title').contains(title);
        message && selector('.modal-body div').contains(message);
    };

    const closeCross = () => {
        selector('.fa.fa-times.close').click();
        selector().should('not.exist');
    };

    const close = () => {
        selector('#cancelModalBtn').click();
        selector().should('not.exist');
    };

    const submit = () => {
        selector('#confirmModalBtn').click();
        selector().should('not.exist');
    };

    const submitInvalid = () => {
        selector('#confirmModalBtn').click();
        selector().should('exist');
    };

    return {
        isOpen,
        close,
        submit,
        submitInvalid,
        closeCross,
        selector
    };
}

module.exports = test;
