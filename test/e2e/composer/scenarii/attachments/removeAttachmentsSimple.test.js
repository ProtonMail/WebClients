const { assert, isTrue, isFalse } = require('../../../../e2e.utils/assertions');

module.exports = ({ editor }) => () => {

    let borodin, dropzone, listAttachments;

    it('should contains two items', () => {
        borodin = editor.compose();
        const uploader = borodin.uploader();
        dropzone = uploader.dropzone();
        listAttachments = uploader.attachmentsList();

        listAttachments.countItems()
            .then(assert(2));
    });

    it('should remove one item', () => {
        listAttachments.remove()
            .then(() => browser.sleep(300))
            .then(() => listAttachments.countItems())
            .then(assert(1));
    });

    it('should not close the list', () => {
        listAttachments.isOpened()
            .then(isTrue);
    });


    it('should remove one item', () => {
        listAttachments.remove()
            .then(() => browser.sleep(1000))
            .then(() => listAttachments.countItems())
            .then(assert(0))
            .then(() => browser.sleep(1000));
    });

    it('should hide the list', () => {
        listAttachments.isVisible()
            .then(isFalse);
    });

    it('should remove one image to the editor', () => {
        browser.sleep(1000)
            .then(() => dropzone.matchIframe())
            .then(assert(0));
    });


};
