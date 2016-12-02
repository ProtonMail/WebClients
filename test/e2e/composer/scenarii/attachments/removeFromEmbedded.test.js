const { assert, isTrue, isFalse } = require('../../../../e2e.utils/assertions');

module.exports = ({ editor }) => () => {

    let borodin, dropzone, listAttachments;

    it('should remove one image inside the editor', () => {
        borodin = editor.compose();
        const uploader = borodin.uploader();
        dropzone = uploader.dropzone(editor);
        listAttachments = uploader.attachmentsList();

        borodin.removeEmbedded()
            .then(() => browser.sleep(1000))
            .then(() => dropzone.matchIframe())
            .then(assert(1));
    });

    it('should remove one embedded', () => {
        listAttachments.getCounter('embedded')
            .then(assert(1));
    });

    it('should count 1 attachment', () => {
        listAttachments.getCounter()
            .then(assert(1));
    });

    it('should remove another one', () => {
        borodin.removeEmbedded()
            .then(() => browser.sleep(1000))
            .then(() => dropzone.matchIframe())
            .then(assert(0));
    });

    it('should remove all embedded', () => {
        listAttachments.getCounter('embedded')
            .then(assert(-1));
    });

    it('should count 1 attachment', () => {
        listAttachments.getCounter()
            .then(assert(1));
    });
};
