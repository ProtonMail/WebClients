const notifs = require('../../../e2e.utils/notifications');
const { assert, isTrue, isFalse } = require('../../../e2e.utils/assertions');

module.exports = ({ editor }) => {
    describe('Save a draft', () => {

        let borodin;

        it('should save a draft', () => {
            borodin = editor.compose();

            borodin.saveDraft()
                .then(() => editor.isOpened())
                .then(isTrue)
                .then(() => browser.sleep(500));
        });

        it('should display a notfication', () => {
            browser.wait(() => {
                return notifs.isOpened()
                    .then((test) => test === true)
            }, 10000)
                .then(() => browser.sleep(5000))
                .then(() => notifs.message())
                .then(assert('Message saved'));
        });

        it('should close the draft', () => {
            borodin.close()
                .then(() => browser.sleep(5000))
                .then(() => browser.wait(() => {
                    return editor.isOpened()
                        .then((test) => test === false);
                }, 10000))
                .then(() => editor.isOpened())
                .then(isFalse);
        });
    });

};
