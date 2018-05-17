const { isTrue, isFalse } = require('../../../e2e.utils/assertions');

module.exports = ({ message, editor }) => {

    describe('Add an image', () => {

        let modal, borodin;

        it('should display the modal', () => {
            borodin = editor.compose();
            modal = borodin.addFileModal();
            modal.openModal()
                .then(() => modal.isVisible())
                .then(isTrue);
        });

        it('should close the modal on submit', () => {
            modal.bindLink(message.linkImage)
                .then(() => modal.submit())
                .then(() => browser.sleep(300))
                .then(() => modal.isVisible())
                .then(isFalse);
        });

        it('should add an image', () => {
            modal.matchIframe(message.linkImage)
                .then(isTrue);
        });
    });

};
