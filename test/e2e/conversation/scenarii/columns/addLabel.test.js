const addLabelsSpecs = require('../../../SCENARII/addLabels.spec');
const { assert, isTrue } = require('../../../../e2e.utils/assertions');
const toolbar = require('../../../../e2e.utils/toolbar');

module.exports = (column) => {
    describe('Add a label to the conversation', () => {

        const INDEX = 0;

        it('should contains only e2e', () => {
            column.labels.getByConversation(INDEX)
                .then(assert(['e2e']));
        });

        it('should select a conversation', () => {
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
            selected: [1],
            archive: false,
            countAlreadySelected: 1,
            shouldArchivedDefault: false
        });

        it('should contains 2 labels', () => {
            browser.sleep(500);
            column.labels.getByConversation(INDEX)
                .then(assert(['e2e', 'e2e-scenario']));
        });

        addLabelsSpecs({
            title: 'Remove a label',
            unselected: [1],
            archive: false,
            countAlreadySelected: 2,
            shouldArchivedDefault: false
        });

        it('should contains only e2e after remove', () => {
            browser.sleep(1000);
            column.labels.getByConversation(INDEX)
                .then(assert(['e2e']));
        });

        it('should unselected all conversation', () => {
            toolbar.selectAll()
                .then(() => toolbar.selectAll())
                .then(() => column.countSeleted())
                .then(assert(0));
        });
    });

};
