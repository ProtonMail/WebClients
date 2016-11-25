const { assert, isTrue, isFalse } = require('../../../../e2e.utils/assertions');

module.exports = ({ editor }) => () => {

    let borodin, dropzone, listAttachments;

    it('should not contains an image inside the editor', () => {
        borodin = editor.compose();
        const uploader = borodin.uploader();
        dropzone = uploader.dropzone();
        listAttachments = uploader.attachmentsList();
        dropzone.matchIframe()
            .then(assert(0));
    });

    it('should display the askEmbedded screen', () => {
        borodin.upload(3);
        browser.sleep(500)
            .then(() => dropzone.countDroppedFiles())
            .then(assert(3));
    });

    it('should upload all as embedded', () => {
        dropzone.embedded()
            .then(() => browser.sleep(1000))
            .then(() => listAttachments.isVisible())
            .then(isTrue);
    });

    it('should count 3 attachments in the list', () => {
        listAttachments.countItems()
            .then(assert(3))
            .then(() => browser.sleep(5000));
    });

    it('should count 1 attachment', () => {
        listAttachments.getCounter()
            .then(assert(1));
    });

    it('should count 2 embedded', () => {
        listAttachments.getCounter('embedded')
            .then(assert(2));
    });

};
