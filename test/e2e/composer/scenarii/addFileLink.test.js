const { isTrue, isFalse } = require('../../../e2e.utils/assertions');

module.exports = ({ message, editor }) => {

    describe('Add an image', () => {

        let popover, borodin;

        it('should display the popover', () => {
            borodin = editor.compose();
            popover = borodin.addFilePopover();
            popover.openForm()
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

        it('should add an image', () => {
            popover.matchIframe(message.linkImage)
                .then(isTrue);
        });
    });

};
