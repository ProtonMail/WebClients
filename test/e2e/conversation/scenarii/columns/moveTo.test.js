const notifs = require('../../../../e2e.utils/notifications');
const { assert, isTrue, isFalse } = require('../../../../e2e.utils/assertions');
const toolbar = require('../../../../e2e.utils/toolbar');

module.exports = (column) => {
    describe('Move to', () => {


        it('should move them all to archive', () => {
            toolbar.selectAll()
                .then(() => toolbar.moveTo('archive'))
                .then(() => browser.sleep(1000))
                .then(() => column.count())
                .then((total) => {
                    column.countFlag('archive')
                        .then(assert(total));
                });
        });

        it('should display a notfication', () => {
            browser.wait(() => {
                return notifs.isOpened()
                    .then((test) => test === true);
            }, 2000)
                .then(() => notifs.containsMessage('Conversations moved to Archive'))
                .then(isTrue);
        });

        it('should have unselect all', () => {
            column.countSeleted()
                .then(assert(0));
        });

        describe('to inbox', () => {

            it('should move them all to inbox', () => {
                toolbar.selectAll()
                    .then(() => toolbar.moveTo('inbox'))
                    .then(() => browser.sleep(1000))
                    .then(() => column.count())
                    .then((total) => {
                        column.countFlag('inbox')
                            .then(assert(total));
                    });
            });

            it('should display a notfication', () => {
                notifs.containsMessage('Conversations moved to Inbox')
                    .then(isTrue);
            });

            it('should have unselect all', () => {
                column.countSeleted()
                    .then(assert(0));
            });
        });

        describe('trash', () => {

            it('should not is masked as trashed', () => {
                column.isFlag(3, 'trash')
                    .then(isFalse);
            });

            it('should unselect the conversation', () => {
                column.select(3)
                    .then(() => toolbar.moveTo('trash'))
                    .then(() => browser.sleep(1000))
                    .then(() => column.countSeleted())
                    .then(assert(0));
            });

            it('should display a notfication', () => {
                notifs.containsMessage('Conversation moved to Trash')
                    .then(isTrue);
            });

            it('should be masked as trashed', () => {
                column.isFlag(3, 'trash')
                    .then(isTrue);
            });
        });

        describe('spam', () => {

            it('should not is masked as trashed', () => {
                column.isFlag(5, 'spam')
                    .then(isFalse);
            });

            it('should unselect the conversation', () => {
                column.select(5)
                    .then(() => toolbar.moveTo('spam'))
                    .then(() => browser.sleep(1000))
                    .then(() => column.countSeleted())
                    .then(assert(0));
            });

            it('should display a notfication', () => {
                notifs.containsMessage('Conversation moved to Spam')
                    .then(isTrue);

            });

            it('should mask as trashed', () => {
                column.isFlag(5, 'spam')
                    .then(isTrue);

                browser.sleep(2000);
            });
        });

    });

};
