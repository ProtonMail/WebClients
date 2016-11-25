const modal = require('../../../e2e.utils/modal');
const notifs = require('../../../e2e.utils/notifications');

module.exports = ({ editor }) => {
    describe('Discard a draft', () => {

        let borodin;

        it('should not display a modal', () => {
            borodin = editor.compose();

            modal.isVisible()
                .then((visible) => {
                    expect(visible).toEqual(false);
                });
        });

        it('should discard the draft and display the modal', () => {
            borodin.discardDraft()
                .then(() => browser.sleep(500))
                .then(() => modal.isVisible())
                .then((visible) => {
                    expect(visible).toEqual(true);
                });
        });


        it('should close the modal', () => {
            modal.cancel()
                .then(() => modal.isVisible())
                .then((visible) => {
                    expect(visible).toEqual(false);
                });
        });

        it('should discard the draft and display the modal 2', () => {
            borodin.discardDraft()
                .then(() => browser.sleep(500))
                .then(() => modal.read())
                .then((text) => {
                    expect(text).toEqual('Permanently delete this draft?');
                });
        });

        it('should close the composer on confirm', () => {
            modal.confirm()
                .then(() => browser.sleep(5000))
                .then(() => borodin.isOpened())
                .then((editor) => {
                    expect(editor).toEqual(false);
                });
        });

        it('should display a notfication', () => {
            notifs.message()
                .then((msg) => {
                    expect(msg).toEqual('Message discarded');
                });
        });

    });

};
