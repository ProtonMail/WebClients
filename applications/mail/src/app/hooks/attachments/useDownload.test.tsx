import type { Download } from '@proton/mail-message/helpers/attachment/attachmentDownloader';
import { formatDownload, generateDownload } from '@proton/mail-message/helpers/attachment/attachmentDownloader';
import type { MessageKeys, MessageStateWithData } from '@proton/mail-message/store/messages/messagesTypes';
import type { Attachment } from '@proton/shared/lib/interfaces/mail/Message';
import { MAIL_VERIFICATION_STATUS } from '@proton/shared/lib/mail/constants';

import { getDriveFileFromDownload } from '../../helpers/attachment/prepareForDrive';
import { renderHook } from '../../helpers/tests/render';
import { useDownload } from './useDownload';

vi.mock('@proton/mail-message/helpers/attachment/attachmentDownloader', async () => ({
    ...(await vi.importActual('@proton/mail-message/helpers/attachment/attachmentDownloader')),
    formatDownload: vi.fn(),
    generateDownload: vi.fn(),
}));

vi.mock('../../helpers/attachment/prepareForDrive', () => ({
    getDriveFileFromDownload: vi.fn(),
}));

const attachment: Attachment = { ID: 'attachment', Name: 'invoice.pdf', MIMEType: 'application/pdf' };
const message = {
    localID: 'message',
    data: { ID: 'message', Flags: 0 },
    verification: { verificationStatus: MAIL_VERIFICATION_STATUS.SIGNED_AND_VALID },
} as unknown as MessageStateWithData;
const outsideKey = { type: 'outside' } as unknown as MessageKeys;
const download: Download = {
    attachment,
    data: new Uint8Array([1, 2, 3]),
    verificationStatus: MAIL_VERIFICATION_STATUS.SIGNED_AND_VALID,
};

describe('useDownload', () => {
    it('prepares an attachment for Drive without starting a browser download', async () => {
        const prepared = { status: 'cannotSave' } as const;
        vi.mocked(formatDownload).mockResolvedValue(download);
        vi.mocked(getDriveFileFromDownload).mockReturnValue(prepared);

        const { result } = await renderHook({ useCallback: () => useDownload() });

        await expect(result.current.prepareForDrive(message, attachment, outsideKey)).resolves.toBe(prepared);

        // The same arguments download passes, so a normal message reuses the copy already in memory.
        expect(formatDownload).toHaveBeenCalledWith(
            attachment,
            message.verification,
            outsideKey,
            expect.any(Function),
            expect.any(Function),
            expect.any(Function),
            0
        );
        expect(getDriveFileFromDownload).toHaveBeenCalledWith(download);
        expect(generateDownload).not.toHaveBeenCalled();
    });
});
