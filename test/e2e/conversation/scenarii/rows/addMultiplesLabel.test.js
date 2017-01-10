const addLabelsSpecs = require('../../../SCENARII/addLabels.spec');
const { assert, isTrue, isFalse } = require('../../../../e2e.utils/assertions');
const toolbar = require('../../../../e2e.utils/toolbar');

module.exports = (rows) => {
    describe('Add multiples labels to a conversation', () => {

        const INDEX = 5;

        it('should select a conversation', () => {
            browser.sleep(1000);
            rows.select(INDEX)
                .then(() => rows.countSeleted())
                .then(assert(1));
        });

        addLabelsSpecs({
            selected: [1, 3],
            archive: false,
            countAlreadySelected: 1,
            shouldArchivedDefault: false
        });

        it('should contains 3 labels', () => {
            browser.sleep(500);
            rows.labels.getByConversation(INDEX)
                .then(assert(['e2e', 'e2e-scenario', 'Lard']));
        });

        it('should unselected all conversation', () => {
            toolbar.selectAll()
                .then(() => toolbar.selectAll())
                .then(() => rows.countSeleted())
                .then(assert(0));
        });

        it('should select a conversation', () => {
            rows.select(INDEX)
                .then(() => rows.countSeleted())
                .then(assert(1));
        });

        addLabelsSpecs({
            title: 'Remove a label',
            unselected: [1, 3],
            archive: false,
            countAlreadySelected: 3,
            shouldArchivedDefault: false
        });

        it('should unselected all conversation', () => {
            toolbar.selectAll()
                .then(() => toolbar.selectAll())
                .then(() => rows.countSeleted())
                .then(assert(0));
        });

        it('should contains only e2e after remove', () => {
            browser.sleep(1000);
            rows.labels.getByConversation(INDEX)
                .then(assert(['e2e']));
        });

    });

};
