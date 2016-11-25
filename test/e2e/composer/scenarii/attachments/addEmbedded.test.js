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

    it('should display the list', () => {
        borodin.upload();
        browser.sleep(500);
        dropzone.embedded()
            .then(() => browser.sleep(1000))
            .then(() => listAttachments.isVisible())
            .then(isTrue);
    });

    it('should not display the dropzone', () => {
        dropzone.isVisibleAsk()
            .then(isFalse);
    });

    it('should not display the askEmbedded', () => {
        dropzone.isVisible()
            .then(isFalse);
    });

    it('should not opened the attachment list', () => {
        listAttachments.isOpened()
            .then(isFalse);
    });

    it('should not display items', () => {
        listAttachments.isVisibleItems()
            .then(isFalse);
    });


    it('should opened the attachment list after toggle', () => {
        listAttachments.toggle()
            .then(() => listAttachments.isOpened())
            .then(isTrue);
    });

    it('should display items', () => {
        listAttachments.isVisibleItems()
            .then(isTrue);
    });

    it('should add one image to the editor', () => {
        browser.sleep(1000)
            .then(() => dropzone.matchIframe())
            .then(assert(1));
    });

    it('should add an attachment to the list', () => {
        listAttachments.countItems()
            .then(assert(2));
    });

};
