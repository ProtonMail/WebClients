const { isTrue, isFalse, assert } = require('../../../e2e.utils/assertions');

module.exports = ({ editor, message }) => {

    describe('Add a link', () => {

        let popover, borodin;

        it('should display the modal', () => {
            borodin = editor.compose();
            popover = borodin.addLinkModal();
            popover.openModal()
                .then(() => popover.isVisible())
                .then(isTrue);
        });

        it('should close the popover on submit', () => {
            popover.bindLink(message.linkImage)
                .then(() => popover.submit())
                .then(() => browser.sleep(300))
                .then(() => popover.isVisible())
                .then(isFalse);
        });

        it('should add a link', () => {
            popover.matchIframe(message.linkImage)
                .then(isTrue);
        });

        it('should update the link', () => {
            popover.openForm()
                .then(() => popover.readInput())
                .then(assert({ label: message.linkImage, link: message.linkImage }))
                .then(() => browser.sleep(300));
        });

        it('should add a link with a label', () => {
            popover.bindLink(message.linkImage)
                .then(() => popover.bindLabel(message.linkLabel))
                .then(() => popover.submit())
                .then(() => browser.sleep(300))
                .then(() => popover.matchIframe(message.linkImage, message.linkLabel))
                .then(isTrue);
        });
    });


};
