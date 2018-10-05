import { isIE11, isEdge } from '../../../helpers/browser';

/* @ngInject */
function pasteImage(attachmentFileFormat, attachmentModel, squireExecAction, gettextCatalog) {
    const I18N = {
        PASTED_IMAGE: gettextCatalog.getString('Pasted-image', null, 'Title pasted image')
    };

    /**
     * Both Edge and IE11 are unable to use the file constructor
     * @param  {File} file
     * @return {File}      or Blob (IE11)
     */
    const getFile = (file) => {
        const isEdgeBrowser = isEdge();
        if (!isIE11() && !isEdgeBrowser) {
            // No ext by default
            const [, ext = ''] = (file.type || 'image/jpeg').split('/');
            return new File([file], `${I18N.PASTED_IMAGE}-${new Date()}.${ext}`, {
                lastModified: new Date(),
                type: file.type
            });
        }

        // FileName is already image.png we can't change it sadly
        return isEdgeBrowser ? file.getAsFile() : file;
    };

    /**
     * When we paste into the composer a media we need to add some options
     * - Mode inline
     * - It's an attachment
     * @param  {File} raw
     * @param  {Message} message
     * @return {void}
     */
    const paste = async (raw, message) => {
        if (!attachmentFileFormat.isUploadMIMEType(raw.type)) {
            return;
        }

        const file = getFile(raw);

        file.inline = 1;
        file.upload = {
            uuid: `${Math.random()
                .toString(32)
                .slice(2, 12)}-${Date.now()}`
        };

        const { url, cid } = (await attachmentModel.create(file, message)) || {};

        squireExecAction.insertImage(message, {
            url,
            opt: {
                'data-embedded-img': cid,
                alt: file.title
            }
        });
    };

    return (message, type) => (e) => {
        if (type === 'paste.image') {
            return paste(e.file, message);
        }

        // IE11 needs the one from window
        const { clipboardData = window.clipboardData } = e;
        // Edge needs items as files is undefined
        const files = Array.from(clipboardData.files || clipboardData.items || []);

        const promises = files.map((file) => paste(file, message));
        Promise.all(promises);
    };
}
export default pasteImage;
