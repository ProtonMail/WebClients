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


    describe('Toggle label conversation', () => {

        const INDEX = 0;

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

        addLabelsSpecs({
            selected: [1],
            archive: false,
            countAlreadySelected: 1,
            shouldArchivedDefault: false
        });

        it('should contains 2 labels', () => {
            browser.sleep(1000);
            column.labels.getByConversation(INDEX)
                .then(assert(['e2e', 'e2e-scenario']));
        });

        addLabelsSpecs({
            unselected: [1],
            archive: false,
            countAlreadySelected: 2,
            shouldArchivedDefault: false
        });

        it('should contains only e2e', () => {
            browser.sleep(1000);
            column.labels.getByConversation(INDEX)
                .then(assert(['e2e']));
        });


        describe('Select into the list', () => {

            const INDEX = 5;

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

            addLabelsSpecs({
                selected: [1, 3],
                archive: false,
                countAlreadySelected: 1,
                shouldArchivedDefault: false
            });

            it('should have 0 conversation selected', () => {
                column.placeholder.countSeleted()
                    .then(assert(0));
            });

            it('should contains 3 labels', () => {
                browser.sleep(1000);
                column.labels.getByConversation(INDEX)
                    .then(assert(['e2e', 'e2e-scenario', 'Lard']));
            });

            it('should select a conversation', () => {
                column.select(INDEX)
                    .then(isTrue);
            });

            it('should have 0 conversation selected', () => {
                column.placeholder.countSeleted()
                    .then(assert(1));
            });

            addLabelsSpecs({
                unselected: [1, 3],
                archive: false,
                countAlreadySelected: 3,
                shouldArchivedDefault: false
            });

            it('should contains only e2e', () => {
                browser.sleep(1000);
                column.labels.getByConversation(INDEX)
                    .then(assert(['e2e']));
            });


        });


    });


});
