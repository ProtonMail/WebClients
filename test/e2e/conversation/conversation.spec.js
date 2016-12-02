const { isTrue, isFalse, assert, greaterThan } = require('../../e2e.utils/assertions');
const webapp = require('../../e2e.utils/webapp');
const addLabelsSpecs = require('../SCENARII/addLabels.spec');
const utils = require('./conversation.po')();


describe('Test conversations', () => {

    const column = utils.load();

    it('should load the e2e label', () => {
        webapp.openLabel('e2e')
            .then(() => browser.sleep(2000));
    });

    it('should display the placeholder', () => {
        column.placeholder.isVisible()
            .then(isTrue);
    });

    it('should have 0 conversation selected', () => {
        column.placeholder.countSeleted()
            .then(assert(0));
    });

    it('should have severals conversations', () => {
        column.count()
            .then(greaterThan(0));
    });

    describe('Toggle label conversation', () => {

        const INDEX = 2;

        it('should contains only e2e', () => {
            column.labels.getByConversation(INDEX)
                .then(assert(['e2e']));
        });

        it('should select a conversation', () => {
            column.select(INDEX)
                .then(isTrue);
        });

        it('should display the placeholder', () => {
            column.placeholder.isVisible()
                .then(isTrue);
        });

        it('should have 1 conversation selected', () => {
            column.placeholder.countSeleted()
                .then(assert(1));
        });

        addLabelsSpecs({ selected: [1], archive: false });

    });


});
