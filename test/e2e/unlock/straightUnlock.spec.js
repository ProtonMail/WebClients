const unlockPage = require('./unlock.po')();
const { isTrue } = require('../../e2e.utils/assertions');

describe('Unlock tests', () => {


    it('should unlock', () => {
        unlockPage.fill(browser.params.password2)
            .then(() => unlockPage.submit())
            .then(() => {
                browser.wait(() => {
                    return browser.getCurrentUrl().then((url) => {
                        return url.indexOf('/inbox') !== -1;
                    });
                }, 10000)
                .then(isTrue);
            });
    });
});
