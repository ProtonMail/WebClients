const { isTrue, isFalse, assert, greaterThan } = require('../../e2e.utils/assertions');
const webapp = require('../../e2e.utils/webapp');
const utils = require('./conversation.po')();


describe('Test conversations', () => {

    const column = utils.load();

    it('should load the e2e label', () => {
        webapp.openLabel('e2e-scenario')
            .then(() => browser.sleep(2000));
    });

    it('should display the placeholder', () => {
        column.placeholder.isVisible()
            .then(isTrue);
    });

    it('should have 0 conversations selected', () => {
        column.placeholder.countSeleted()
            .then(assert(0));
    });

    it('should have severals conversations', () => {
        column.count()
            .then(greaterThan(0));
    });


});
