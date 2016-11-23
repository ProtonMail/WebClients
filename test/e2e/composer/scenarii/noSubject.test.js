const modal = require('../../../e2e.utils/modal');
const notifs = require('../../../e2e.utils/notifications');

module.exports = ({ editor, message, identifier }) => {
    describe('Composer simple message', () => {

        let borodin;

        it('should open a the composer', () => {
            editor.open();
            browser.sleep(500);
            editor.isOpened()
                .then((test) => {
                    borodin = editor.compose();
                    expect(test).toEqual(true);
                });
        });

        it('should not display a modal', () => {
            modal.isVisible()
                .then((visible) => {
                    expect(visible).toEqual(false);
                });
        })

        it('should create a new message', () => {
            borodin
                .content(message.body)
                .then((text) => {
                    expect(text).toEqual(message.body);
                });
        });

        it('should not display CC and BCC fields', () => {
            borodin.isVisible('CCList')
                .then((test) => {
                    expect(test).toEqual(false);
                });

            borodin.isVisible('BCCList')
                .then((test) => {
                    expect(test).toEqual(false);
                });
        });

        it('should add a recepient', () => {
            borodin.fillInput('ToList', message.ToList)
                .then((text) => {
                    expect(text).toEqual('');
                });
        });


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
