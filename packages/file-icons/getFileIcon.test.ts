import { PROTON_DOCS_DOCUMENT_MIMETYPE } from '@proton/shared/lib/helpers/mimetype';

import { getFileIcon } from './getFileIcon';
import { MimeFolder } from './icons/MimeFolder';
import { MimeImage } from './icons/MimeImage';
import { MimePdf } from './icons/MimePdf';
import { MimeProtonDoc } from './icons/MimeProtonDoc';
import { MimeUnknown } from './icons/MimeUnknown';
import { MimeZip } from './icons/MimeZip';

describe('getFileIcon', () => {
    it('returns the component for a mime type in the explicit map', () => {
        expect(getFileIcon('application/zip')).toBe(MimeZip);
        expect(getFileIcon('Folder')).toBe(MimeFolder);
        expect(getFileIcon(PROTON_DOCS_DOCUMENT_MIMETYPE)).toBe(MimeProtonDoc);
    });

    it('falls back to the mime type family', () => {
        expect(getFileIcon('application/pdf')).toBe(MimePdf);
        expect(getFileIcon('image/png')).toBe(MimeImage);
    });

    it('returns the unknown icon for anything else', () => {
        expect(getFileIcon('application/x-made-up')).toBe(MimeUnknown);
    });
});
