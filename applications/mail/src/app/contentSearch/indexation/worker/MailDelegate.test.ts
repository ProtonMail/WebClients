import type { AttachmentsMetadata } from '@proton/shared/lib/interfaces/mail/Message';
import { ATTACHMENT_DISPOSITION } from '@proton/shared/lib/mail/constants';

import { getIndexedAttachmentNames } from './MailDelegate';

const attachment = (
    Name: string,
    MIMEType: string,
    Disposition = ATTACHMENT_DISPOSITION.ATTACHMENT
): AttachmentsMetadata => {
    return { ID: Name, Name, MIMEType, Disposition, Size: 1 };
};

describe('getIndexedAttachmentNames', () => {
    it('joins listable filenames and drops keys and inline parts (spec example)', () => {
        const value = getIndexedAttachmentNames([
            attachment('Q3_invoice-final.pdf', 'application/pdf'),
            attachment('roadmap.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'),
            attachment('publickey.asc', 'application/pgp-keys'),
            attachment('logo.png', 'image/png', ATTACHMENT_DISPOSITION.INLINE),
        ]);

        expect(value).toBe('Q3_invoice-final.pdf, roadmap.docx');
    });

    it('drops non-listable categories', () => {
        const value = getIndexedAttachmentNames([
            attachment('invite.ics', 'text/calendar'),
            attachment('archive.zip', 'application/zip'),
            attachment('notes.txt', 'text/plain'),
            attachment('song.mp3', 'audio/mpeg'),
        ]);

        expect(value).toBe('song.mp3');
    });

    it('keeps filenames unmodified, including ones containing the separator', () => {
        const value = getIndexedAttachmentNames([
            attachment(' Smith, John.PDF', 'application/pdf'),
            attachment('b.png', 'image/png'),
        ]);

        expect(value).toBe(' Smith, John.PDF, b.png');
    });

    it('returns an empty string without listable attachments', () => {
        expect(getIndexedAttachmentNames(undefined)).toBe('');
        expect(getIndexedAttachmentNames([])).toBe('');
        expect(getIndexedAttachmentNames([attachment('key.asc', 'application/pgp-keys')])).toBe('');
    });
});
