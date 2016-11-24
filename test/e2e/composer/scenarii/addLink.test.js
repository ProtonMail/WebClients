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
                .then(() => popover.isVisible())
                .then((test) => {
                    browser.sleep(300);
                    expect(test).toEqual(false);
                });
        });

        it('should add a link', () => {
            popover.matchIframe(message.linkImage)
                .then((test) => {
                    expect(test).toEqual(true);
                });
        });
    });


};
