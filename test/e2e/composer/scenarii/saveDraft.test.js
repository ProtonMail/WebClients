const notifs = require('../../../e2e.utils/notifications');

module.exports = ({ editor }) => {
    describe('Save a draft', () => {

        let borodin;

        it('should save a draft', () => {
            borodin = editor.compose();

            borodin.saveDraft()
                .then(() => editor.isOpened())
                .then((visible) => {
                    expect(visible).toEqual(true);
                    browser.sleep(500);
                });
        });

        it('should display a notfication', () => {
            notifs.message()
                .then((msg) => {
                    expect(msg).toEqual('Message saved');
                });
        });

        it('should close the draft', () => {
            borodin.close()
                .then(() => browser.sleep(1000))
                .then(() => editor.isOpened())
                .then((visible) => {
                    expect(visible).toEqual(false);
                });
        });
    });

};
