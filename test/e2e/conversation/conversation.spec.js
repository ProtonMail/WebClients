const { isTrue, isFalse, assert, greaterThan } = require('../../e2e.utils/assertions');
const webapp = require('../../e2e.utils/webapp');
const toolbar = require('../../e2e.utils/toolbar');
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

    it('should not select any element', () => {
        column.countSeleted()
            .then(assert(0));
    });

    describe('Select conversations', () => {

        it('should select all elements', () => {
            toolbar.selectAll()
                .then(() => column.count())
                .then((total) => {
                    column.countSeleted()
                        .then(assert(total));
                });
        });

        it('should count all selected elements on the placeholder', () => {
            column.placeholder.countSeleted()
                .then(() => column.count())
                .then((total) => {
                    column.countSeleted()
                        .then(assert(total));
                    column.countSeleted()
                        .then(greaterThan(0));
                });
        });

        it('should unselect all elements', () => {
            toolbar.selectAll()
                .then(() => column.countSeleted())
                .then(assert(0));
        });

        it('should count 0 selected elements on the placeholder', () => {
            column.placeholder.countSeleted()
                .then(assert(0));
        });

        it('should select one element', () => {
            column.select(0)
                .then(() => column.countSeleted())
                .then(assert(1));
        });

        it('should count 1 selected element on the placeholder', () => {
            column.placeholder.countSeleted()
                .then(assert(1));
        });

        it('should select another element', () => {
            column.select(3)
                .then(() => column.countSeleted())
                .then(assert(2));
        });

        it('should count 2 selected elements on the placeholder', () => {
            column.placeholder.countSeleted()
                .then(assert(2));
        });

        it('should select all elements', () => {
            toolbar.selectAll()
                .then(() => column.count())
                .then((total) => {
                    column.countSeleted()
                        .then(assert(total));
                    column.countSeleted()
                        .then(greaterThan(0));
                });
        });


        it('should count selected elements on the placeholder', () => {
            column.placeholder.countSeleted()
                .then(() => column.count())
                .then((total) => {
                    column.countSeleted()
                        .then(assert(total));
                    column.countSeleted()
                        .then(greaterThan(0));
                });
        });

        it('should unselected everything on click button placeholder unselect all', () => {
            column.placeholder.unselect()
                .then(() => column.placeholder.countSeleted())
                .then(assert(0))
                .then(() => column.countSeleted())
                .then(assert(0));
        });

    });

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

});
