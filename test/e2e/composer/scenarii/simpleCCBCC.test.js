module.exports = ({ editor, message, identifier }) => {
    describe('Composer simple message', () => {

        let borodin;

        it('should open a the composer', () => {
            editor.open();
            browser.sleep(500);
            editor
                .isOpened()
                .then((test) => {
                    borodin = editor.compose();
                    expect(test).toEqual(true);
                });
        });

        it('should create a new message', () => {
            borodin
                .content(message.body)
                .then((text) => {
                    expect(text).toEqual(message.body);
                });
        });

        it('should display CC and BCC fields', () => {
            borodin.openCCBCC()
                .then(() => {
                    borodin.isVisible('CCList')
                        .then((test) => {
                            expect(test).toEqual(true);
                        });

                    borodin.isVisible('BCCList')
                        .then((test) => {
                            expect(test).toEqual(true);
                        });
                    browser.sleep(2000);
                });

        });

        it('should add a recepient', () => {
            borodin
                .fillInput('ToList', message.ToList)
                .then((text) => {
                    expect(text).toEqual('');
                });
        });

        it('should add a recepient CC', () => {
            borodin
                .fillInput('CCList', message.CCList)
                .then((text) => {
                    expect(text).toEqual('');
                });
        });

        it('should add a recepient BCC', () => {
            borodin
                .fillInput('BCCList', message.BCCList)
                .then((text) => {
                    expect(text).toEqual('');
                });
        });

        it('should add a subject', () => {
            const subject = `${message.Subject} - test:${identifier}`;
            borodin.fillInput('Subject', `${message.Subject} - test:${identifier}`)
                .then((text) => {
                    expect(text).toEqual(subject);
                });
        });

        it('should send the message', () => {
            borodin
                .send()
                .then(() => browser.sleep(5000))
                .then(() => {
                    borodin.isOpened()
                        .then((editor) => {
                            expect(editor).toEqual(false);
                        });
                });
        });
    });

};
