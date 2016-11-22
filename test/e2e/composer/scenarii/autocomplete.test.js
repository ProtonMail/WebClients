module.exports = (editor, message, { identifier }) => {
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

        it('should create a new message', () => {
            borodin.content(message.body)
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

        it('should add a subject', () => {
            const subject = `${message.Subject} - test:${identifier}`;
            borodin.fillInput('Subject', `${message.Subject} - test:${identifier}`)
                .then((text) => {
                    expect(text).toEqual(subject);
                });
        });


        it('should add a file link', () => {
            const { openForm, bindLink, submit, matchIframe } = borodin.addFilePopover();
            openForm()
                .then(bindLink(message.linkImage))
                .then(submit())
                .then(() => browser.sleep(1000))
                .then(matchIframe(message.linkImage))
                .then((img) => {
                    expect(img).not.toEqual(null);
                });
        });


        it('should send the message', () => {
            borodin.send()
                .then(() => browser.sleep(5000))
                .then(() => {
                    borodin.isOpened()
                        .then((editor) => {
                            expect(editor).toEqual(false);
                        });
                });
        });
    });

}
