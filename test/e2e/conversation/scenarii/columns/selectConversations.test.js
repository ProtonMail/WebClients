const { assert, greaterThan } = require('../../../../e2e.utils/assertions');
const toolbar = require('../../../../e2e.utils/toolbar');

module.exports = (column) => {
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
};
