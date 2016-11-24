const notifs = require('../../../e2e.utils/notifications');

module.exports = ({ editor, message }) => {
    describe('Encrypt the message', () => {

        let encryption, borodin;

        describe('Form invalid', () => {

            it('should not is encrypted', () => {
                borodin = editor.compose();
                encryption = borodin.encryption();

                encryption.isActive()
                    .then((test) => {
                        expect(test).toEqual(false);
                    });
            });

            it('should not display the form', () => {
                encryption.isVisible()
                    .then((test) => {
                        expect(test).toEqual(false);
                    });
            });


            it('should open the form', () => {
                encryption.open()
                    .then(() => encryption.isVisible())
                    .then((test) => {
                        expect(test).toEqual(true);
                    });
            });

            it('should disabled the encryption submit button', () => {
                encryption.isDisabledSubmit()
                    .then((test) => {
                        expect(test).toEqual(true);
                    });
            });

            it('should fill the password', () => {
                encryption.fillInput('password', 'monique')
                    .then(() => encryption.isInvalidInput('password'))
                    .then((test) => {
                        expect(test).toEqual(false);
                    });
            });

            it('should disabled the encryption submit button', () => {
                encryption.isDisabledSubmit()
                    .then((test) => {
                        expect(test).toEqual(true);
                    });
            });


            it('should fill the confirm password', () => {
                encryption.fillInput('confirm', 'jeanne')
                    .then(() => encryption.isInvalidInput('confirm'))
                    .then((test) => {
                        expect(test).toEqual(false); // need refacto component
                    });
            });

            it('should disabled the encryption submit button', () => {
                encryption.isDisabledSubmit()
                    .then((test) => {
                        expect(test).toEqual(false);  // need refacto component
                    });
            });

            it('should fill the hint message', () => {
                encryption.fillInput('hint', 'deux qui la tiennent')
                    .then((value) => {
                        expect(value).toEqual('deux qui la tiennent');
                    });
            });

            it('should not disabled the encryption submit button', () => {
                encryption.isDisabledSubmit()
                    .then((test) => {
                        expect(test).toEqual(false);
                    });
            });

            it('should submit the form', () => {
                encryption.submit()
                    .then(() => browser.sleep(500))
                    .then(() => notifs.message())
                    .then((value) => {
                        expect(value).toEqual('Message passwords do not match.');

                        encryption.isVisible()
                            .then((test) => {
                                expect(test).toEqual(true);
                            });
                    });
            });

            it('should not mark the composer button as active', () => {
                encryption.isActive()
                    .then((test) => {
                        expect(test).toEqual(false);
                    });
            });

            it('should close the panel', () => {
                encryption.cancel()
                    .then(() => encryption.isVisible())
                    .then((test) => {
                        expect(test).toEqual(false);
                    });
            });
        });

        describe('Form valid: no hint', () => {

            it('should not is encrypted', () => {
                encryption = borodin.encryption();
                browser.sleep(6000)
                    .then(() => encryption.isActive())
                    .then((test) => {
                        expect(test).toEqual(false);
                    });
            });

            it('should not display the form', () => {
                encryption.isVisible()
                    .then((test) => {
                        expect(test).toEqual(false);
                    });
            });


            it('should open the form', () => {
                encryption.open()
                    .then(() => encryption.isVisible())
                    .then((test) => {
                        expect(test).toEqual(true);
                    });
            });

            it('should disabled the encryption submit button', () => {
                encryption.isDisabledSubmit()
                    .then((test) => {
                        expect(test).toEqual(true);
                    });
            });

            it('should fill the password', () => {
                encryption.fillInput('password', 'monique')
                    .then(() => encryption.isInvalidInput('password'))
                    .then((test) => {
                        expect(test).toEqual(false);
                    });
            });

            it('should disabled the encryption submit button', () => {
                encryption.isDisabledSubmit()
                    .then((test) => {
                        expect(test).toEqual(true);
                    });
            });


            it('should fill the confirm password (error)', () => {
                encryption.fillInput('confirm', 'jeanne')
                    .then(() => encryption.isInvalidInput('confirm'))
                    .then((test) => {
                        expect(test).toEqual(false); // need refacto component
                    });
            });

            it('should disabled the encryption submit button', () => {
                encryption.isDisabledSubmit()
                    .then((test) => {
                        expect(test).toEqual(false);// need refacto button
                    });
            });


            it('should fill the confirm password (success)', () => {
                encryption.fillInput('confirm', 'monique')
                    .then(() => encryption.isInvalidInput('confirm'))
                    .then((test) => {
                        expect(test).toEqual(false);
                    });
            });

            it('should not disabled the encryption submit button', () => {
                encryption.isDisabledSubmit()
                    .then((test) => {
                        expect(test).toEqual(false);
                    });
            });

            it('should submit the form without errors', () => {
                encryption.submit()
                    .then(() => browser.sleep(500))
                    .then(() => notifs.message())
                    .then((value) => {
                        expect(value).not.toEqual('Message passwords do not match.');

                        encryption.isVisible()
                            .then((test) => {
                                expect(test).toEqual(false);
                            });
                    });
            });

            it('should mark the composer button as active', () => {
                encryption.isActive()
                    .then((test) => {
                        expect(test).toEqual(true);
                    });
            });
        });

    });

};
