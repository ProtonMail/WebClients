module.exports = () => {

    const SELECTOR = {
        input: {
            username: '#Username',
            password: '#password',
            confirmPassword: '#passwordc',
            recoveryEmail: '#notificationEmail'
        },
        select: {
            domains: '.selectDomain'
        }
    };

    SELECTOR.button = {
        showPassword: `${SELECTOR.input.password} ~ .togglePassword-btn-toggle`,
        showConfirmPassword: `${SELECTOR.input.confirmPassword} ~ .togglePassword-btn-toggle`,
        create: '.signUpProcess-btn-create'
    };

    SELECTOR.messages = {
        username: {
            available: '.signUpProcess-about-success',
            pending: '.signUpProcess-about-pending'
        },

        errors: {
            password: `${SELECTOR.input.password} + [ng-messages] p`,
            confirmPassword: `${SELECTOR.input.confirmPassword} + [ng-messages] p`,
            recoveryEmail: `${SELECTOR.input.confirmPassword} + [ng-messages] p`,
            username: '.signUpProcess-about-error p'
        }
    };

    const fillInput = (name, value = '') => {
        return browser.executeScript(`
            const $input = $('${SELECTOR.input[name]}');
            $input.val('${value}').triggerHandler('input');
            return $input.blur();
        `);
    };

    const usernameMsg = (key = 'pending') => {
        return browser.executeScript(`
            return $('${SELECTOR.messages.username[key]}')
                .text();
        `);
    };

    const getErrors = (key) => {
        const scope = SELECTOR.messages.errors[key];

        const isVisible = () => {
            return browser.executeScript(`
                return $('${scope}')
                    .is(':visible');
            `);
        };

        const count = () => {
            return browser.executeScript(`
                return $('${scope}').length;
            `);
        };

        const getMessage = () => {
            return browser.executeScript(`
                return $('${scope}').map(function() {
                    return angular.copy(this.textContent);
                });
            `);
        };

        return { isVisible, count, getMessage };
    };

    return {
        fillInput, usernameMsg, getErrors
    };
};
