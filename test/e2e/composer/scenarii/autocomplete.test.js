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
            borodin.content(message.body)
                .then(assert(message.body));
        });

        it('should not display CC and BCC fields', () => {
            borodin.isVisible('CCList')
                .then(isFalse);

            borodin.isVisible('BCCList')
                .then(isFalse);
        });

        describe('ToList field', () => {
            let autocomplete;

            describe('Valid email', () => {
                it('should not contains any labels', () => {
                    autocomplete = borodin.autocomplete('ToList');
                    autocomplete.countLabels()
                        .then(assert(0));
                });

                it('should add a recepient en set the input value empty', () => {
                    borodin.fillInput('ToList', message.ToList)
                        .then(assert(''));
                });

                it('should not be invalid', () => {
                    autocomplete.isInvalidLabel()
                        .then(isFalse);
                });

                it('should contains 1 labels', () => {
                    autocomplete.countLabels()
                        .then(assert(1));
                });

                it('should find the added value to the label', () => {
                    autocomplete.getLabels()
                        .then(assert(message.ToList));
                });

                it('should remove the label', () => {
                    autocomplete.removeLabel()
                        .then(() => autocomplete.countLabels())
                        .then((counter) => {
                            expect(counter).toBe(0);
                        });
                });
            });

            describe('Invalid email', () => {

                const email = 'jeanne mange des anes';

                it('should not contains any labels', () => {
                    autocomplete = borodin.autocomplete('ToList');
                    autocomplete.countLabels()
                        .then(assert(0));
                });

                it('should add a recepient en set the input value empty', () => {
                    borodin.fillInput('ToList', email)
                        .then(assert(''));
                });

                it('should be invalid', () => {
                    autocomplete.isInvalidLabel()
                        .then(isTrue);
                });

                it('should contains 1 labels', () => {
                    autocomplete.countLabels()
                        .then(assert(1));
                });

                it('should find the added value to the label', () => {
                    autocomplete.getLabels()
                        .then(assert(email));
                });

                it('should remove the label', () => {
                    autocomplete.removeLabel()
                        .then(() => autocomplete.countLabels())
                        .then(assert(0));
                });
            });

            it('should display the autocomplete', () => {
                autocomplete.listIsVisible()
                    .then((test) => {
                        expect(test).toEqual(true);
                        browser.sleep(500);
                    });
            });

        });

        it('should add the recepient', () => {
            borodin.fillInput('ToList', message.ToList)
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
                        .then((test) => test === false);
                }, 10000))
                .then(() => browser.sleep(5000))
                .then(() => borodin.isOpened())
                .then(isFalse);
        });

        it('should display a notfication', () => {
            browser.wait(() => {
                return notifs.isOpened()
                    .then((test) => test === true);
            }, 10000)
                .then(() => notifs.message())
                .then(assert('Message sent'));
        });
    });

};
