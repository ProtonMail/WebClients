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

        describe('Set an expiration time to the message', () => {

            let expiration;

            it('should not have an expiration time', () => {
                expiration = borodin.expiration();

                expiration.isActive()
                    .then((test) => {
                        expect(test).toEqual(false);
                    });
            });

            it('should not display the form', () => {
                expiration.isVisible()
                    .then((test) => {
                        expect(test).toEqual(false);
                    });
            });

            it('should open the form', () => {
                expiration.open()
                    .then(() => expiration.isVisible())
                    .then((test) => {
                        expect(test).toEqual(true);
                    });
            });

            it('should set some value', () => {

                const timer = message.expiration;

                expiration.setValue('day', timer.days)
                    .then(() => expiration.setValue('week', timer.weeks))
                    .then(() => expiration.setValue('hour', timer.hours))
                    .then(() => expiration.getValues())
                    .then((map) => {
                        expect(map.days).toEqual(timer.days);
                        expect(map.weeks).toEqual(timer.weeks);
                        expect(map.hours).toEqual(timer.hours);
                    });
            });

            it('should submit the form', () => {
                expiration.submit()
                    .then(() => browser.sleep(500))
                    .then(() => expiration.isVisible())
                    .then((test) => {
                        expect(test).toEqual(false);
                    });
            });


            it('should mark the composer button as active', () => {
                expiration.isActive()
                    .then((test) => {
                        expect(test).toEqual(true);
                    });
            });

            it('should open the form', () => {
                expiration.open()
                    .then(() => expiration.isVisible())
                    .then((test) => {
                        expect(test).toEqual(true);
                    });
            });

            it('should close the form', () => {
                expiration.cancel()
                    .then(() => expiration.isVisible())
                    .then((test) => {
                        expect(test).toEqual(false);
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

};
