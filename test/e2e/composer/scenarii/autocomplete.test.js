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

        describe('ToList field', () => {
            let autocomplete;

            describe('Valid email', () => {
                it('should not contains any labels', () => {
                    autocomplete = borodin.autocomplete('ToList');
                    autocomplete.countLabels()
                        .then((counter) => {
                            expect(counter).toBe(0);
                        });
                })

                it('should add a recepient en set the input value empty', () => {
                    borodin.fillInput('ToList', message.ToList)
                        .then((text) => {
                            expect(text).toEqual('');
                        });
                })

                it('should not be invalid', () => {
                    autocomplete.isInvalidLabel()
                        .then((test) => {
                            expect(test).toEqual(false);
                        });
                })

                it('should contains 1 labels', () => {
                    autocomplete.countLabels()
                        .then((counter) => {
                            expect(counter).toBe(1);
                        });
                })

                it('should find the added value to the label', () => {
                    autocomplete.getLabels()
                        .then((value) => {
                            expect(value).toBe(message.ToList);
                        });
                })

                it('should remove the label', () => {
                    autocomplete.removeLabel()
                        .then(() => autocomplete.countLabels())
                        .then((counter) => {
                            expect(counter).toBe(0);
                        });
                })
            })

            describe('Invalid email', () => {

                const email = 'jeanne mange des anes';

                it('should not contains any labels', () => {
                    autocomplete = borodin.autocomplete('ToList');
                    autocomplete.countLabels()
                        .then((counter) => {
                            expect(counter).toBe(0);
                        });
                })

                it('should add a recepient en set the input value empty', () => {
                    borodin.fillInput('ToList', email)
                        .then((text) => {
                            expect(text).toEqual('');
                        });
                })

                it('should be invalid', () => {
                    autocomplete.isInvalidLabel()
                        .then((test) => {
                            expect(test).toEqual(true);
                        });
                })

                it('should contains 1 labels', () => {
                    autocomplete.countLabels()
                        .then((counter) => {
                            expect(counter).toBe(1);
                        });
                })

                it('should find the added value to the label', () => {
                    autocomplete.getLabels()
                        .then((value) => {
                            expect(value).toBe(email);
                        });
                })

                it('should remove the label', () => {
                    autocomplete.removeLabel()
                        .then(() => autocomplete.countLabels())
                        .then((counter) => {
                            expect(counter).toBe(0);
                        });
                })
            });

            it('should display the autocomplete', () => {
                autocomplete.listIsVisible()
                    .then((test) => {
                        expect(test).toEqual(true);
                        browser.sleep(500);
                    });
            })

        })

        it('should add the recepient', () => {
            borodin.fillInput('ToList', message.ToList)
                .then((text) => {
                    expect(text).toEqual('');
                });
        })

        it('should add a subject', () => {
            const subject = `${message.Subject} - test:${identifier}`;
            borodin.fillInput('Subject', `${message.Subject} - test:${identifier}`)
                .then((text) => {
                    expect(text).toEqual(subject);
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
