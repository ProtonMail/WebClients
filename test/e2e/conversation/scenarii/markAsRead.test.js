const { assert, isTrue, isFalse } = require('../../../e2e.utils/assertions');
const toolbar = require('../../../e2e.utils/toolbar');

module.exports = (column) => {
    describe('Mark as read', () => {

        describe('every messages', () => {

            it('should mark all as read', () => {
                toolbar.selectAll()
                    .then(() => browser.sleep(1000))
                    .then(() => column.count())
                    .then((total) => {
                        toolbar.read()
                            .then(() => browser.sleep(2000))
                            .then(() => column.countRead())
                            .then(assert(total));
                    });
            });

            it('should mark all as unread', () => {
                toolbar.read(false)
                    .then(() => browser.sleep(1000))
                    .then(() => column.countRead())
                    .then(assert(0));
            });

        });

        describe('One message', () => {

            it('should mark the conversation as read', () => {
                toolbar.selectAll()
                    .then(() => column.select(3))
                    .then(() => toolbar.read())
                    .then(() => browser.sleep(1000))
                    .then(() => column.isRead(3))
                    .then(isTrue);
            });

            it('should mark the conversation as unread', () => {
                toolbar.read(false)
                    .then(() => browser.sleep(1000))
                    .then(() => column.isRead(3))
                    .then(isFalse);
            });

        });
    });

};
