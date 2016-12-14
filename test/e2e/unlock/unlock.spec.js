const { isTrue, isFalse, assert, assertUrl } = require('../../e2e.utils/assertions');
const modal = require('../../e2e.utils/modal');
const notif = require('../../e2e.utils/notifications');
const loginPage = require('./../login/login.po')();
const unlockPage = require('./unlock.po')();
const NOTIF_PASSWORD_ERROR = 'Password is required.';
const NOTIF_WRONG_PASSWORD_ERROR = 'Wrong decryption password.';

describe('unlock the mailbox', () => {

    const loader = unlockPage.loader;

    it('should not display the loader', () => {
        loader.isVisible()
            .then(isFalse);
    });

    it('should not display the loader logo', () => {
        loader.isVisibleLogo()
            .then(isFalse);
    });

    it('should not display the loader loader', () => {
        loader.isVisibleLoader()
            .then(isFalse);
    });

    it('should display the form', () => {
        unlockPage.isVisibleForm()
            .then(isTrue);
    });

    it('should not display the modal', () => {
        modal.isVisible()
            .then(isFalse);
    });

    describe('Modal report a bug', () => {
        it('should display the modal on click', () => {
            unlockPage.header.bugReport()
                .then(() => browser.sleep(1000))
                .then(() => modal.isVisible())
                .then(isTrue);
        });

        it('should display the modal report a bug', () => {
            modal.title()
                .then(assert('Report Bug'));
        });

        it('should close the modal', () => {
            modal.cancel()
                .then(() => browser.sleep(1000))
                .then(() => modal.isVisible())
                .then(isFalse);
        });
    });

    describe('Back action', () => {

        beforeEach(() => {
            browser.ignoreSynchronization = true;
            browser.get('http://localhost:8080/login');
            browser.waitForAngular();
            loginPage.fill('username', browser.params.login);
            loginPage.fill('password', browser.params.password1);
            loginPage.submit();
            browser.sleep(5000);
        });

        it('should go to protonmail.com', () => {
            loginPage.back()
                .then(() => browser.sleep(1000))
                .then(() => {
                    expect(browser.getCurrentUrl()).toEqual('https://protonmail.com/');
                });

        });

        it('should come back', () => {
            browser.sleep(1000);
            expect(browser.getCurrentUrl()).toContain('/login/unlock');
        });

    });


    describe('Forgot my password', () => {

        afterEach(() => {
            browser.ignoreSynchronization = true;
            browser.get('http://localhost:8080/login');
            browser.waitForAngular();
            loginPage.fill('username', browser.params.login);
            loginPage.fill('password', browser.params.password1);
            loginPage.submit();
            browser.sleep(5000);
        });

        it('should redirect us to the page HELP/forgetpassword', () => {
            unlockPage.openForgotPassword();
            browser.wait(() => {
                return browser.getCurrentUrl().then((url) => {
                    return url.indexOf('/help/reset-login-password') !== -1;
                });
            }, 10000)
            .then(isTrue);
        });
    });

    describe('Send a value', () => {

        describe('nothing', () => {

            it('should submit the form via event display a notification:danger', () => {
                unlockPage.submit()
                    .then(() => browser.sleep(5000))
                    .then(() => notif.message('danger'))
                    .then(assert(NOTIF_PASSWORD_ERROR))
                    .then(assertUrl('/unlock'));
            });

            it('should not diplsay the loader on submit:event', () => {
                unlockPage.submit()
                    .then(() => loader.isVisible())
                    .then(isFalse);
            });

            it('should not diplsay the loader logo on submit:event', () => {
                unlockPage.submit()
                    .then(() => loader.isVisibleLogo())
                    .then(isFalse);
            });

            it('should not diplsay the loader loader on submit:event', () => {
                unlockPage.submit()
                    .then(() => loader.isVisibleLoader())
                    .then(isFalse);
            });

            it('should submit the form via click button display a notification:danger', () => {
                unlockPage.clickSubmit()
                    .then(() => browser.sleep(5000))
                    .then(() => notif.message('danger'))
                    .then(assert(NOTIF_PASSWORD_ERROR))
                    .then(assertUrl('/unlock'));
            });

            it('should not diplsay the loader on submit:click', () => {
                unlockPage.clickSubmit()
                    .then(() => loader.isVisible())
                    .then(isFalse);
            });

            it('should not diplsay the loader logo on submit:click', () => {
                unlockPage.clickSubmit()
                    .then(() => loader.isVisibleLogo())
                    .then(isFalse);
            });

            it('should not diplsay the loader loader on submit:click', () => {
                unlockPage.clickSubmit()
                    .then(() => loader.isVisibleLoader())
                    .then(isFalse);
            });

        });

        describe('wrong password', () => {

            beforeEach(() => {
                unlockPage.fill('monique');
            });

            it('should submit the form via event display a notification:danger', () => {
                unlockPage.submit()
                    .then(() => browser.sleep(5000))
                    .then(() => notif.message('danger'))
                    .then(assert(NOTIF_WRONG_PASSWORD_ERROR))
                    .then(assertUrl('/unlock'));
            });

            it('should not diplsay the loader on submit:event', () => {
                unlockPage.submit()
                    .then(() => loader.isVisible())
                    .then(isFalse);
            });

            it('should not diplsay the loader logo on submit:event', () => {
                unlockPage.submit()
                    .then(() => loader.isVisibleLogo())
                    .then(isFalse);
            });

            it('should not diplsay the loader loader on submit:event', () => {
                unlockPage.submit()
                    .then(() => loader.isVisibleLoader())
                    .then(isFalse);
            });

            it('should submit the form via click button display a notification:danger', () => {
                unlockPage.clickSubmit()
                    .then(() => browser.sleep(5000))
                    .then(() => notif.message('danger'))
                    .then(assert(NOTIF_WRONG_PASSWORD_ERROR))
                    .then(assertUrl('/unlock'));
            });

            it('should not diplsay the loader on submit:click', () => {
                unlockPage.clickSubmit()
                    .then(() => loader.isVisible())
                    .then(isFalse);
            });

            it('should not diplsay the loader logo on submit:click', () => {
                unlockPage.clickSubmit()
                    .then(() => loader.isVisibleLogo())
                    .then(isFalse);
            });

            it('should not diplsay the loader loader on submit:click', () => {
                unlockPage.clickSubmit()
                    .then(() => loader.isVisibleLoader())
                    .then(isFalse);
            });

        });

        describe('valid password', () => {

            beforeEach(() => {
                browser.ignoreSynchronization = true;
                browser.get('http://localhost:8080/login');
                browser.waitForAngular();
                loginPage.fill('username', browser.params.login);
                loginPage.fill('password', browser.params.password1);
                loginPage.submit();
                browser.sleep(5000);
                unlockPage.fill(browser.params.password2);
            });

            it('should submit the form via event', () => {
                unlockPage.submit();
                browser.wait(() => {
                    return browser.getCurrentUrl().then((url) => {
                        return url.indexOf('/inbox') !== -1;
                    });
                }, 10000)
                .then(isTrue);
            });

            it('should diplsay the loader on submit:event', () => {
                unlockPage.submit()
                    .then(() => browser.sleep(1000))
                    .then(() => loader.isVisible())
                    .then(isTrue);
            });

            it('should diplsay the loader logo on submit:event', () => {
                unlockPage.submit()
                    .then(() => browser.sleep(1000))
                    .then(() => loader.isVisibleLogo())
                    .then(isTrue);
            });

            it('should diplsay the loader loader on submit:event', () => {
                unlockPage.submit()
                    .then(() => browser.sleep(1000))
                    .then(() => loader.isVisibleLoader())
                    .then(isTrue);
            });

            it('should submit the form via click button', () => {
                unlockPage.clickSubmit();
                browser.wait(() => {
                    return browser.getCurrentUrl().then((url) => {
                        return url.indexOf('/inbox') !== -1;
                    });
                }, 10000)
                .then(isTrue);
            });

            it('should diplsay the loader on submit:click', () => {
                unlockPage.clickSubmit()
                    .then(() => browser.sleep(1000))
                    .then(() => loader.isVisible())
                    .then(isTrue);
            });

            it('should diplsay the loader logo on submitclick', () => {
                unlockPage.clickSubmit()
                    .then(() => browser.sleep(1000))
                    .then(() => loader.isVisibleLogo())
                    .then(isTrue);
            });

            it('should diplsay the loader loader on submitclick', () => {
                unlockPage.clickSubmit()
                    .then(() => browser.sleep(1000))
                    .then(() => loader.isVisibleLoader())
                    .then(isTrue);
            });

        });
    });

});
