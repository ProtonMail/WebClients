const modal = require('../../../e2e.utils/modal');
const notifs = require('../../../e2e.utils/notifications');
const { isTrue, isFalse, assert } = require('../../../e2e.utils/assertions');

module.exports = ({ editor }) => {
    describe('Discard a draft', () => {

        let borodin;

        it('should not display a modal', () => {
            borodin = editor.compose();

            modal.isVisible()
                .then(isFalse);
        });

        it('should discard the draft and display the modal', () => {
            borodin.discardDraft()
                .then(() => browser.sleep(500))
                .then(() => modal.isVisible())
                .then(isTrue);
        });


        it('should close the modal', () => {
            modal.cancel()
                .then(() => modal.isVisible())
                .then(isFalse);
        });

        it('should discard the draft and display the modal 2', () => {
            borodin.discardDraft()
                .then(() => browser.sleep(500))
                .then(() => modal.read())
                .then(assert('Permanently delete this draft?'));
        });

        it('should close the composer on confirm', () => {
            modal.confirm()
                .then(() => browser.sleep(5000))
                .then(() => borodin.isOpened())
                .then(isFalse);
        });

        it('should display a notfication', () => {
            notifs.message()
                .then(assert('Message discarded'));
        });

    });

};
