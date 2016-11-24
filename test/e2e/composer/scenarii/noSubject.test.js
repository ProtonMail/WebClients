const modal = require('../../../e2e.utils/modal');
const notifs = require('../../../e2e.utils/notifications');

module.exports = ({ editor, message }) => {
    describe('No subject', () => {

        let borodin;

        it('should not display a modal', () => {
            borodin = editor.compose();

            modal.isVisible()
                .then((visible) => {
                    expect(visible).toEqual(false);
                });
        })


        it('should send the message and display a modal', () => {
            borodin.send()
                .then(() => browser.sleep(1000))
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

        it('should send the message and display a modal', () => {
            borodin.send()
                .then(() => browser.sleep(1000))
                .then(() => modal.read())
                .then((text) => {
                    expect(text).toEqual('No subject, send anyway?');
                });
        });

        it('should send the message on confirm', () => {
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
                    expect(msg).toEqual('Message sent');
                });
        });
    });

};
