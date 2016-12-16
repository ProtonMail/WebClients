const { assert, isTrue, isFalse } = require('../../../../e2e.utils/assertions');

module.exports = ({ editor }) => () => {

    let borodin, dropzone, listAttachments;

    it('should display the list', () => {
        borodin = editor.compose();
        const uploader = borodin.uploader();
        dropzone = uploader.dropzone(editor);
        listAttachments = uploader.attachmentsList();

        borodin.upload();
        browser.sleep(500);

        dropzone.attachment()
            .then(() => browser.sleep(1000))
            .then(() => {
                return browser.wait(() => {
                    return listAttachments.isVisible()
                        .then((test) => test === true);
                }, 10000);
            })
            .then(isTrue)
            .then(() => browser.sleep(2000));
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

    it('should add an attachment to the list', () => {
        listAttachments.countItems()
            .then(assert(1));
    });

    it('should bind 1 into the counter', () => {
        listAttachments.getCounter()
            .then(assert(1));
    });

    it('should not bind a counter for embedded', () => {
        listAttachments.getCounter('embedded')
            .then(assert(-1));
    });

};
