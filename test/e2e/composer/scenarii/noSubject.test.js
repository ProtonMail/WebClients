const modal = require('../../../e2e.utils/modal');
const notifs = require('../../../e2e.utils/notifications');
const { isTrue, isFalse, assert } = require('../../../e2e.utils/assertions');

module.exports = ({ editor }) => {
    describe('No subject', () => {

        let borodin;

        it('should not display a modal', () => {
            borodin = editor.compose();

            modal.isVisible()
                .then(isFalse);
        });


        it('should send the message and display a modal', () => {
            borodin.send()
                .then(() => browser.sleep(1000))
                .then(() => modal.isVisible())
                .then(isTrue);
        });

        it('should close the modal', () => {
            modal.cancel()
                .then(() => modal.isVisible())
                .then(isFalse);
        });

        it('should send the message and display a modal', () => {
            borodin.send()
                .then(() => browser.sleep(1000))
                .then(() => modal.read())
                .then(assert('No subject, send anyway?'));
        });

        it('should send the message on confirm', () => {
            modal.confirm()
                .then(() => browser.sleep(5000))
                .then(() => borodin.isOpened())
                .then(isFalse);
        });

        it('should display a notfication', () => {
            notifs.message()
                .then(assert('Message sent'));
        });
    });

};
