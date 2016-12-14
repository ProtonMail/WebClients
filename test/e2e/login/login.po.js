module.exports = () => {

    const SELECTOR = {
        form: '.loginForm-containter',
        error: '[id="error521"]',
        username: '.loginForm-input-username',
        password: '.loginForm-input-password',
        anchorHelp: '.loginForm-btn-help',
        buttonSubmit: '.loginForm-btn-submit',
        buttonModal: '.newBugReport-container',
        anchorOld: '.login-btn-oldversion',
        anchorSignup: '.headerNoAuth-btn-signup',
        anchorLogout: '.headerNoAuth-btn-logout',
        anchorBack: '.headerNoAuth-btn-back',
    };

    const fill = (type, value) => {
        return browser.executeScript(`
            const $input = $(document.querySelector('${SELECTOR.form}'))
            .find('${SELECTOR[type]}');

            $input.val('${value}');
            $input.triggerHandler('input');
            $input.blur();
        `);
    };

    const submit = () => {
        return browser.executeScript(`
            $(document.querySelector('${SELECTOR.form}'))
            .submit();
        `);
    };

    const clickSubmit = () => {
        return browser.executeScript(`
            $(document.querySelector('${SELECTOR.form}'))
            .find('${SELECTOR.buttonSubmit}')
            .click();
        `);
    };

    const openHelp = () => {
        return browser.executeScript(`
            $(document.querySelector('${SELECTOR.form}'))
            .find('${SELECTOR.anchorHelp}')
            .click();
        `);
    };

    const openModal = () => {
        return browser.executeScript(`
            $('${SELECTOR.buttonModal}')
            .click();
        `);
    };

    const signup = () => {
        return browser.executeScript(`
            $(document.querySelector('${SELECTOR.anchorSignup}'))
            .click();
        `);
    };

    const oldVersion = () => {
        return browser.executeScript(`
            $(document.querySelector('${SELECTOR.anchorOld}'))
            .click();
        `);
    };

    const back = () => {
        return browser.executeScript(`
            document.querySelector('${SELECTOR.anchorBack}')
                .click();
        `);
    };

    return {
        fill, submit, back, signup, oldVersion,
        clickSubmit, openModal, openHelp
    };

};
