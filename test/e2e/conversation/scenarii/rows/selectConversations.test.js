const { assert, greaterThan } = require('../../../../e2e.utils/assertions');
const toolbar = require('../../../../e2e.utils/toolbar');

module.exports = (rows) => {
    describe('Select conversations', () => {

        it('should select all elements', () => {
            toolbar.selectAll()
                .then(() => rows.count())
                .then((total) => {
                    rows.countSeleted()
                        .then(assert(total));
                });
        });


        it('should unselect all elements', () => {
            toolbar.selectAll()
                .then(() => rows.countSeleted())
                .then(assert(0));
        });

        it('should select one element', () => {
            rows.select(0)
                .then(() => rows.countSeleted())
                .then(assert(1));
        });

        it('should select another element', () => {
            rows.select(3)
                .then(() => rows.countSeleted())
                .then(assert(2));
        });


        it('should select all elements', () => {
            toolbar.selectAll()
                .then(() => rows.count())
                .then((total) => {
                    rows.countSeleted()
                        .then(assert(total));
                    rows.countSeleted()
                        .then(greaterThan(0));
                });
        });

    });
};
