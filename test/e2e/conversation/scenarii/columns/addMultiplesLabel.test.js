const addLabelsSpecs = require('../../../SCENARII/addLabels.spec');
const { assert, isTrue, isFalse } = require('../../../../e2e.utils/assertions');
const toolbar = require('../../../../e2e.utils/toolbar');

module.exports = (column) => {
    describe('Add multiples labels to a conversation', () => {

        const INDEX = 5;

        it('should select a conversation', () => {
            browser.sleep(1000);
            column.select(INDEX)
                .then(() => column.countSeleted())
                .then(assert(1));
        });

        it('should display the placeholder', () => {
            column.placeholder.isVisible()
                .then(isTrue);
        });

        it('should have 1 conversation selected', () => {
            column.placeholder.countSeleted()
                .then(assert(1));
        });

        addLabelsSpecs({
            selected: [1, 3],
            archive: false,
            countAlreadySelected: 1,
            shouldArchivedDefault: false
        });

        it('should hide the placeholder', () => {
            column.placeholder.isVisible()
                .then(isFalse);
        });

        it('should contains 3 labels', () => {
            browser.sleep(500);
            column.labels.getByConversation(INDEX)
                .then(assert(['e2e', 'e2e-scenario', 'Lard']));
        });

        it('should unselected all conversation', () => {
            toolbar.selectAll()
                .then(() => toolbar.selectAll())
                .then(() => column.countSeleted())
                .then(assert(0));
        });

        it('should select a conversation', () => {
            column.select(INDEX)
                .then(() => column.countSeleted())
                .then(assert(1));
        });

        addLabelsSpecs({
            title: 'Remove a label',
            unselected: [1, 3],
            archive: false,
            countAlreadySelected: 3,
            shouldArchivedDefault: false
        });

        it('should hide the placeholder', () => {
            column.placeholder.isVisible()
                .then(isFalse);
        });

        it('should unselected all conversation', () => {
            toolbar.selectAll()
                .then(() => toolbar.selectAll())
                .then(() => column.countSeleted())
                .then(assert(0));
        });

        it('should contains only e2e after remove', () => {
            browser.sleep(1000);
            column.labels.getByConversation(INDEX)
                .then(assert(['e2e']));
        });

    });

};
