const { isTrue, isFalse } = require('../../../e2e.utils/assertions');

module.exports = ({ editor, message }) => {

    describe('Add a link', () => {

        let popover, borodin;

        it('should display the popover', () => {
            borodin = editor.compose();
            popover = borodin.addLinkPopover();
            popover.openForm()
                .then(() => popover.isVisible())
                .then((test) => {
                    expect(test).toEqual(true);
                });
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
    });


};
