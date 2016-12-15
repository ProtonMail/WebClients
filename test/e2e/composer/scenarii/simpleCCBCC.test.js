const notifs = require('../../../e2e.utils/notifications');
const { isTrue, isFalse, assert } = require('../../../e2e.utils/assertions');

module.exports = ({ editor, message, identifier }) => {
    describe('Composer simple message', () => {

        let borodin;

        it('should open a the composer', () => {
            editor.open()
                .then(() => browser.wait(() => {
                    return editor.isOpened()
                        .then((test) => test === true)
                }, 10000))
                .then((test) => (borodin = editor.compose(), test))
                .then(isTrue);
        });

        it('should create a new message', () => {
            borodin
                .content(message.body)
                .then(assert(message.body));
        });

        it('should display CC and BCC fields', () => {
            borodin.openCCBCC()
                .then(() => {
                    borodin.isVisible('CCList')
                        .then(isTrue);

                    borodin.isVisible('BCCList')
                        .then(isTrue);
                    browser.sleep(2000);
                });

        });

        it('should add a recepient', () => {
            borodin
                .fillInput('ToList', message.ToList)
                .then(assert(''));
        });

        it('should add a recepient CC', () => {
            borodin
                .fillInput('CCList', message.CCList)
                .then(assert(''));
        });

        it('should add a recepient BCC', () => {
            borodin
                .fillInput('BCCList', message.BCCList)
                .then(assert(''));
        });

        it('should add a subject', () => {
            const subject = `${message.Subject} - test:${identifier}`;
            borodin.fillInput('Subject', `${message.Subject} - test:${identifier}`)
                .then(assert(subject));
        });

        it('should send the message', () => {
            borodin.send()
                .then(() => browser.wait(() => {
                    return editor.isOpened()
                        .then((test) => test === false)
                }, 15000))
                .then(() => borodin.isOpened())
                .then(isFalse);
        });

        it('should display a notfication', () => {
            browser.wait(() => {
                return notifs.isOpened()
                    .then((test) => test === true)
            }, 10000)
                .then(() => notifs.message())
                .then(assert('Message sent'));
        });
    });

};
