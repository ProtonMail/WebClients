
module.exports = ({ editor }) => {
    describe('Upload a file a draft', () => {

        let borodin, dropzone, listAttachments;

        it('should not display the dropzone', () => {
            borodin = editor.compose();
            const uploader = borodin.uploader();
            dropzone = uploader.dropzone();
            listAttachments = uploader.attachmentsList();

            dropzone.isVisible()
                .then((visible) => {
                    expect(visible).toEqual(false);
                });
        });

        it('should not display the askEmbedded zone', () => {
            dropzone.isVisibleAsk()
                .then((visible) => {
                    expect(visible).toEqual(false);
                });
        });

        it('should display the askEmbedded', () => {
            borodin.upload();
            browser.sleep(1000);

            dropzone.isVisibleAsk()
                .then((visible) => {
                    expect(visible).toEqual(true);
                });
        });

    });

};
