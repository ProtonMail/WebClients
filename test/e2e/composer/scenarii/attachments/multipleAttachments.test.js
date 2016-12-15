const { assert, isTrue, isFalse } = require('../../../../e2e.utils/assertions');

module.exports = ({ editor }) => () => {

    let borodin, dropzone, listAttachments;

    it('should display the askEmbedded screen', () => {
        borodin = editor.compose();
        const uploader = borodin.uploader();
        dropzone = uploader.dropzone(editor);
        listAttachments = uploader.attachmentsList();

        borodin.upload(3);
        browser.sleep(500)
            .then(() => dropzone.countDroppedFiles())
            .then(assert(3));
    });

    it('should upload all as embedded', () => {
        dropzone.embedded()
            .then(() => browser.sleep(1000))
            .then(() => listAttachments.isVisible())
            .then(isTrue)
            .then(() => browser.sleep(3000));
    });

    it('should count 3 attachments in the list', () => {
        browser.wait(() => {
            return listAttachments.countItems()
                .then((v) => v === 3)
        }, 20000)
            .then(() => listAttachments.countItems())
            .then(assert(3))
            .then(() => browser.sleep(3000));
    });

    it('should count 1 attachment', () => {
        listAttachments.getCounter()
            .then(assert(1));
    });

    it('should count 2 embedded', () => {
        listAttachments.getCounter('embedded')
            .then(assert(2));
    });

    it('should contains 2 images inside the editor', () => {
        browser.sleep(1000)
            .then(() => dropzone.matchIframe())
            .then(assert(2));
    });

};
