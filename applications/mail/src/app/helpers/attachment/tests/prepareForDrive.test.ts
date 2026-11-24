import type { Download } from '@proton/mail-message/helpers/attachment/attachmentDownloader';
import { MAIL_VERIFICATION_STATUS } from '@proton/shared/lib/mail/constants';

import { getDriveFileFromDownload } from '../prepareForDrive';

const data = new Uint8Array([1, 2, 3, 4, 5]);

const getDownload = (overrides: Partial<Download> = {}): Download => {
    return {
        attachment: { ID: '1', Name: 'invoice.pdf', MIMEType: 'application/pdf', Size: 900 },
        data,
        verificationStatus: MAIL_VERIFICATION_STATUS.SIGNED_AND_VALID,
        ...overrides,
    };
};

describe('getDriveFileFromDownload', () => {
    it('a decrypted attachment is ready with its original name, type, bytes and byte length', () => {
        expect(getDriveFileFromDownload(getDownload())).toEqual({
            status: 'ready',
            file: { data, name: 'invoice.pdf', mediaType: 'application/pdf', size: 5 },
        });
    });

    it('a missing type falls back to application/octet-stream', () => {
        const download = getDownload({ attachment: { ID: '1', Name: 'notes' } });

        expect(getDriveFileFromDownload(download)).toMatchObject({
            file: { mediaType: 'application/octet-stream' },
        });
    });

    it('a failed sender check comes back as sender not verified with the same contents', () => {
        const download = getDownload({ verificationStatus: MAIL_VERIFICATION_STATUS.SIGNED_AND_INVALID });

        expect(getDriveFileFromDownload(download)).toEqual({
            status: 'senderNotVerified',
            file: { data, name: 'invoice.pdf', mediaType: 'application/pdf', size: 5 },
        });
    });

    it("an attachment that couldn't be decrypted can't be saved and carries no contents, even if its sender check also failed", () => {
        const download = getDownload({
            attachment: { ID: '1', Name: 'invoice.pdf.pgp', MIMEType: 'application/pgp-encrypted' },
            isError: true,
            verificationStatus: MAIL_VERIFICATION_STATUS.SIGNED_AND_INVALID,
        });

        expect(getDriveFileFromDownload(download)).toEqual({ status: 'cannotSave' });
    });

    it.each([MAIL_VERIFICATION_STATUS.NOT_SIGNED, MAIL_VERIFICATION_STATUS.NOT_VERIFIED])(
        'unsigned and unverified attachments are ready, as download treats them (status %s)',
        (verificationStatus) => {
            expect(getDriveFileFromDownload(getDownload({ verificationStatus }))).toMatchObject({ status: 'ready' });
        }
    );
});
