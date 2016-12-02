const { isTrue, isFalse, assert } = require('../../../e2e.utils/assertions');
const notifs = require('../../../e2e.utils/notifications');


module.exports = ({ editor }) => {
    describe('Chnage signature', () => {

        let borodin, dropzone;

        it('should contains on image', () => {
            borodin = editor.compose();
            const uploader = borodin.uploader();
            dropzone = uploader.dropzone({
                config: {}
            });
            dropzone.matchIframe()
                .then(assert(1));
        });

        it('should allow us to change the from', () => {
            borodin.changeSignature(1).click()
                .then(() => browser.sleep(1000))
                .then(() => notifs.message('danger'))
                .then(assert(null));
        });

        it('should update the message with the new signature', () => {
            borodin.changeSignature(1).change()
                .then(() => browser.sleep(1000))
                .then(() => dropzone.matchIframe())
                .then(assert(0));
        });


    });

};
