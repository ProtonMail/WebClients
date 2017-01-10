const notifs = require('../../../e2e.utils/notifications');
const { isTrue, isFalse, assert } = require('../../../e2e.utils/assertions');

module.exports = (customSuite, { message, editor, identifier }, options = {}) => {

    const { send = true, subject = true } = options;

    describe('Composer simple message', () => {

        let borodin;

        it('should open a the composer', () => {
            browser.sleep(5000)
                .then(() => editor.open())
                .then(() => browser.wait(() => {
                    return editor.isOpened()
                        .then((test) => test === true);
                }, 15000))
                .then((test) => (borodin = editor.compose(), test))
                .then(isTrue);
        });

        it('should create a new message', () => {
            borodin.content(message.body)
                .then(assert(message.body))
                .then(() => editor.checkSignature());
        });

        it('should not display CC and BCC fields', () => {
            borodin.isVisible('CCList')
                .then(isFalse);

            borodin.isVisible('BCCList')
                .then(isFalse);
        });

        it('should add a recepient', () => {
            borodin.fillInput('ToList', message.ToList)
                .then(assert(''));
        });


        if (subject) {
            it('should add a subject', () => {
                const subject = `${message.Subject} - test:${identifier}`;
                borodin.fillInput('Subject', `${message.Subject} - test:${identifier}`)
                    .then(assert(subject));
            });
        }

        customSuite({ message, editor, identifier, borodin });

        if (send) {
            it('should send the message', () => {
                borodin.send()
                    .then(() => browser.wait(() => {
                        return editor.isOpened()
                            .then((test) => test === false)
                    }, 25000))
                    .then(() => borodin.isOpened())
                    .then(isFalse);
            });

            it('should display a notfication', () => {
                browser.wait(() => {
                    return notifs.isOpened()
                        .then((test) => test === true)
                }, 25000)
                    .then(() => notifs.message())
                    .then(assert('Message sent'));
            });
        }
    });

};
