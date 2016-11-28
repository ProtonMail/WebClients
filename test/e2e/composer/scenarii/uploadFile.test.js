const { isTrue, isFalse } = require('../../../e2e.utils/assertions');
const simpleFile = require('./attachments/simpleFile.test');
const addEmbedded = require('./attachments/addEmbedded.test');
const removeAttachmentsSimple = require('./attachments/removeAttachmentsSimple.test');
const multipleAttachments = require('./attachments/multipleAttachments.test');

module.exports = ({ editor }) => {
    describe('Attachments', () => {

        let borodin, dropzone, listAttachments;

        it('should not set the attachment button as active', () => {
            borodin = editor.compose();
            const uploader = borodin.uploader();
            dropzone = uploader.dropzone();
            listAttachments = uploader.attachmentsList();

            uploader.isBtnActive()
                .then(isFalse);
        });

        it('should not display the dropzone', () => {
            dropzone.isVisible()
                .then(isFalse);
        });

        it('should not display the askEmbedded zone', () => {
            dropzone.isVisibleAsk()
                .then(isFalse);
        });

        it('should display the askEmbedded', () => {
            borodin.upload();
            browser.sleep(500);

            dropzone.isVisibleAsk()
                .then(isTrue);
        });

        it('should hide on close', () => {
            dropzone.cancel()
                .then(() => dropzone.isVisibleAsk())
                .then(isFalse)
                .then(() => dropzone.isVisible())
                .then(isFalse);
        });

        describe('Add an attachment', simpleFile({ editor }));
        describe('Add an embedded', addEmbedded({ editor }));
        describe('Remove attachments (simple)', removeAttachmentsSimple({ editor }));
        describe('Multiples attachments', multipleAttachments({ editor }));

    });

};
