module.exports = () => {
    const SELECTOR = {
        container: '#pm_login',
        password: '.unlock-input-password',
        buttonSubmit: '[id="unlock_btn"]',
        buttonForgotPassword: '.unlock-btn-forgot',
        header: {
            buttonModal: '.newBugReport-container',
            anchorLogout: '.headerNoAuth-btn-logout',
            anchorBack: '.headerNoAuth-btn-back'
        },
        loader: {
            container: '.unlock-loader-container',
            logo: '.unlock-loader-logo',
            loader: '.unlock-loader-item'
        }
    };

    const loader = () => {
        const isVisible = () => {
            return browser.executeScript(`
                 return $(document.querySelector('${SELECTOR.container}'))
                    .find('${SELECTOR.loader.container}')
                    .is(':visible');
            `);
        };

        const isVisibleLogo = () => {
            return browser.executeScript(`
                 return $(document.querySelector('${SELECTOR.container}'))
                    .find('${SELECTOR.loader.logo}')
                    .is(':visible');
            `);
        };

        const isVisibleLoader = () => {
            return browser.executeScript(`
                 return $(document.querySelector('${SELECTOR.container}'))
                    .find('${SELECTOR.loader.loader}')
                    .is(':visible');
            `);
        };

        return {
            isVisible,
            isVisibleLogo,
            isVisibleLoader
        };
    };

    const isVisibleForm = () => {
        return browser.executeScript(`
             return $(document.querySelector('${SELECTOR.container}'))
                .is(':visible');
        `);
    };

    const fill = (value) => {
        return browser.executeScript(`
            const $input = $(document.querySelector('${SELECTOR.container}'))
                .find('${SELECTOR.password}');

            $input.val('${value}');
            $input.triggerHandler('input');
            $input.blur();
        `);
    };

    const openForgotPassword = () => {
        return browser.executeScript(`
            $(document.querySelector('${SELECTOR.container}'))
                .find('${SELECTOR.buttonForgotPassword}')
                .click();
        `);
    };

    const submit = () => {
        return browser.executeScript(`
            $(document.querySelector('${SELECTOR.container}'))
            .submit();
        `);
    };

    const clickSubmit = () => {
        return browser.executeScript(`
            $(document.querySelector('${SELECTOR.container}'))
                .find('${SELECTOR.buttonSubmit}')
                .click();
        `);
    };

    const header = () => {

        const back = () => {
            return browser.executeScript(`
                document.querySelector('${SELECTOR.header.anchorBack}')
                    .click();
            `);
        };

        const logout = () => {
            return browser.executeScript(`
                $(document.querySelector('${SELECTOR.header.anchorLogout}'))
                    .click();
            `);
        };

        const bugReport = () => {
            return browser.executeScript(`
                $(document.querySelector('${SELECTOR.header.buttonModal}'))
                    .click();
            `);
        };

        return {
            back,
            logout,
            bugReport
        };
    };

    return {
        fill, openForgotPassword,
        submit, clickSubmit,
        isVisibleForm,
        header: header(),
        loader: loader()
    };

};
