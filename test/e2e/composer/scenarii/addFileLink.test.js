module.exports = ({ message, editor }) => {

    describe('Add an image', () => {

        let popover, borodin;

        it('should display the popover', () => {
            borodin = editor.compose();
            popover = borodin.addFilePopover();
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

        it('should add an image', () => {
            popover.matchIframe(message.linkImage)
                .then((test) => {
                    expect(test).toEqual(true);
                });
        });
    });

};
