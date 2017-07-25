module.exports = () => {
    const { isTrue } = require('../../e2e.utils/assertions');

    describe('The application', () => {


        it('should go to the inbox', () => {
            browser.executeScript('$(\'a[ui-sref="secured.inbox"]\').click();')
                .then(() => browser.sleep(200))
                .then(() => {
                    return browser.wait(() => {
                        return browser.getCurrentUrl().then((url) => {
                            return url.indexOf('/inbox') !== -1;
                        });
                    }, 10000)
                        .then(isTrue);
                })
                .then(() => (browser.wait(() => {
                    return browser.executeScript('return !!$(\'#conversation-list-columns\').length;');
                }, 10000)))
                .then(isTrue);
        });
    });

};
