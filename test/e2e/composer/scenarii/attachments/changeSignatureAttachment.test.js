const { assert, isTrue, isFalse } = require('../../../../e2e.utils/assertions');
const notifs = require('../../../../e2e.utils/notifications');

module.exports = ({ editor }) => () => {

    let borodin, dropzone, listAttachments;

    it('should throw an error if we try to swicth', () => {
        borodin = editor.compose();
        const uploader = borodin.uploader();
        dropzone = uploader.dropzone(editor);
        listAttachments = uploader.attachmentsList();

        borodin.changeSignature(1)
            .then(() => browser.sleep(1000))
            .then(() => notifs.message('danger'))
            .then(assert('Attachments and inline images must be removed first before changing sender'));
    });

    it('should remove the attachment', () => {
        listAttachments.remove()
            .then(() => browser.sleep(1000))
            .then(() => listAttachments.countItems())
            .then(assert(0));
    });

    it('should allow us to change the from', () => {
        borodin.changeSignature(1)
            .then(() => browser.sleep(1000))
            .then(() => notifs.message('danger'))
            .then(assert(void 0));
    });

};
