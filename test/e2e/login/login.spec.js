const { isTrue, isFalse, assert, assertUrl } = require('../../e2e.utils/assertions');
const modal = require('../../e2e.utils/modal');
const notif = require('../../e2e.utils/notifications');
const loginPage = require('./login.po')();
const NOTIF_ERROR = 'Please enter your username and password';
const NOTIF_ERROR_INVALID = 'Incorrect login credentials. Please try again';

describe('login an user', () => {

    it('should move the user not authenticated to login', () => {
        browser.get('http://localhost:8080/');
        browser.waitForAngular();
        expect(browser.getCurrentUrl()).toContain('/login');
    });

    it('should not display the modal', () => {
        modal.isVisible()
            .then(isFalse);
    });

    describe('Modal report a bug', () => {
        it('should display the modal on click', () => {
            loginPage.openModal()
                .then(() => browser.sleep(1000))
                .then(() => modal.isVisible())
                .then(isTrue);
        });

        it('should display the modal report a bug', () => {
            modal.title()
                .then(assert('Report bug'));
        });

        it('should close the modal', () => {
            modal.cancel()
                .then(() => browser.sleep(1000))
                .then(() => modal.isVisible())
                .then(isFalse);
        });
    });

    describe('Modal to help', () => {

        it('should display the modal help on click', () => {
            loginPage.openHelp()
                .then(() => browser.sleep(1000))
                .then(() => modal.isVisible())
                .then(isTrue);
        });

        it('should display the modal Help', () => {
            modal.title()
                .then(assert('Help'));
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
            expect(browser.getCurrentUrl()).toContain('/login');
        });

    });

    describe('Login', () => {

        describe('Nothing', () => {

            it('should display a notification:danger', () => {
                loginPage.submit()
                    .then(() => browser.sleep(5000))
                    .then(() => notif.message('danger'))
                    .then(assert(NOTIF_ERROR))
                    .then(assertUrl('/login'));
            });

            it('should display a notification:danger', () => {
                loginPage.clickSubmit()
                    .then(() => browser.sleep(5000))
                    .then(() => notif.message('danger'))
                    .then(assert(NOTIF_ERROR))
                    .then(assertUrl('/login'));
            });

        });

        describe('Only username', () => {

            beforeEach(() => {
                loginPage.fill('username', browser.params.login);
                loginPage.fill('password', '');
            });

            it('should display a notification:danger', () => {
                loginPage.submit()
                    .then(() => browser.sleep(5000))
                    .then(() => notif.message('danger'))
                    .then(assert(NOTIF_ERROR))
                    .then(assertUrl('/login'));
            });

            it('should display a notification:danger', () => {
                loginPage.clickSubmit()
                    .then(() => browser.sleep(5000))
                    .then(() => notif.message('danger'))
                    .then(assert(NOTIF_ERROR))
                    .then(assertUrl('/login'));
            });

        });

        describe('Only password', () => {

            beforeEach(() => {
                loginPage.fill('username', '');
                loginPage.fill('password', browser.params.password1);
            });

            it('should display a notification:danger', () => {
                loginPage.submit()
                    .then(() => browser.sleep(5000))
                    .then(() => notif.message('danger'))
                    .then(assert(NOTIF_ERROR))
                    .then(assertUrl('/login'));
            });

            it('should display a notification:danger', () => {
                loginPage.clickSubmit()
                    .then(() => browser.sleep(5000))
                    .then(() => notif.message('danger'))
                    .then(assert(NOTIF_ERROR))
                    .then(assertUrl('/login'));
            });

        });

        describe('Wrong username', () => {

            beforeEach(() => {
                loginPage.fill('username', 123);
                loginPage.fill('password', browser.params.password1);
            });

            it('should display a notification:danger', () => {
                loginPage.submit()
                    .then(() => browser.sleep(5000))
                    .then(() => notif.message('danger'))
                    .then(assert(NOTIF_ERROR_INVALID))
                    .then(assertUrl('/login'));
            });

            it('should display a notification:danger', () => {
                loginPage.clickSubmit()
                    .then(() => browser.sleep(5000))
                    .then(() => notif.message('danger'))
                    .then(assert(NOTIF_ERROR_INVALID))
                    .then(assertUrl('/login'));
            });

        });

        describe('Wrong password', () => {

            beforeEach(() => {
                loginPage.fill('username', browser.params.login);
                loginPage.fill('password', 123);
            });

            it('should display a notification:danger', () => {
                loginPage.submit()
                    .then(() => browser.sleep(5000))
                    .then(() => notif.message('danger'))
                    .then(assert(NOTIF_ERROR_INVALID))
                    .then(assertUrl('/login'));
            });

            it('should display a notification:danger', () => {
                loginPage.clickSubmit()
                    .then(() => browser.sleep(5000))
                    .then(() => notif.message('danger'))
                    .then(assert(NOTIF_ERROR_INVALID))
                    .then(assertUrl('/login'));
            });

        });

        describe('Is valid', () => {

            beforeEach(() => {
                browser.ignoreSynchronization = true;
                browser.get('http://localhost:8080/login');
                browser.waitForAngular();

                loginPage.fill('username', browser.params.login);
                loginPage.fill('password', browser.params.password1);
            });

            it('should redirect us', () => {
                loginPage.submit()
                    .then(() => {
                        return browser.wait(() => {
                            return browser.getCurrentUrl().then((url) => {
                                return url.indexOf('/login/unlock') !== -1;
                            });
                        }, 10000);
                    })
                    .then(isTrue);
            });

            it('should redirect us', () => {
                loginPage.clickSubmit()
                    .then(() => {
                        return browser.wait(() => {
                            return browser.getCurrentUrl().then((url) => {
                                return url.indexOf('/login/unlock') !== -1;
                            });
                        }, 10000);
                    })
                    .then(isTrue);
            });

        });

    });

});
