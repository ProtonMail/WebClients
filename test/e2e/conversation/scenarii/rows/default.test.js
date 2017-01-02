const addLabelsSpecs = require('../../../SCENARII/addLabels.spec');
const { assert, isFalse } = require('../../../../e2e.utils/assertions');
const toolbar = require('../../../../e2e.utils/toolbar');

module.exports = (rows) => {
    describe('Add a label to the conversation', () => {

        const INDEX = 0;

        it('should contains only e2e', () => {
            rows.labels.getByConversation(INDEX)
                .then(assert(['e2e']));
        });

        it('should select a conversation', () => {
            rows.select(INDEX)
                .then(() => rows.countSeleted())
                .then(assert(1));
        });

        it('should not display the placeholder', () => {
            rows.placeholder.isVisible()
                .then(isFalse);
        });

        addLabelsSpecs({
            selected: [1],
            archive: false,
            countAlreadySelected: 1,
            shouldArchivedDefault: false
        });

        it('should contains 2 labels', () => {
            browser.sleep(500);
            rows.labels.getByConversation(INDEX)
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
            rows.labels.getByConversation(INDEX)
                .then(assert(['e2e']));
        });

        it('should unselected all conversation', () => {
            toolbar.selectAll()
                .then(() => toolbar.selectAll())
                .then(() => rows.countSeleted())
                .then(assert(0));
        });
    });

};
