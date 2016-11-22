module.exports = (editor, message) => {
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

        it('should add a recepient', () => {
            borodin
                .fillInput('ToList', message.ToList)
                .then((text) => {
                    expect(text).toEqual('');
                });
        });

        it('should add a subject', () => {
            borodin
                .fillInput('Subject', message.Subject)
                .then((text) => {
                    expect(text).toEqual(message.Subject);
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

}
