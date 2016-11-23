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


        describe('Add a link', () => {

            let popover;

            it('should display the popover', () => {
                popover = borodin.addLinkPopover();
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

            it('should add a link', () => {
                popover.matchIframe(message.linkImage)
                    .then((test) => {
                        expect(test).toEqual(true);
                    });
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
