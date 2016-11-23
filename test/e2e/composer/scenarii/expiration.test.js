module.exports = ({ editor, message }) => {
    describe('Set an expiration time to the message', () => {

        let expiration, borodin;

        it('should not have an expiration time', () => {
            borodin = editor.compose();
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

};
