import { encodeBase64 } from '@proton/crypto/lib/utils';
import type { MessageKeys, MessageVerification } from '@proton/mail/store/messages/messagesTypes';
import * as browser from '@proton/shared/lib/helpers/browser';
import * as downloadFile from '@proton/shared/lib/helpers/downloadFile';
import { stringToUint8Array } from '@proton/shared/lib/helpers/encoding';
import type { Attachment } from '@proton/shared/lib/interfaces/mail/Message';
import { MAIL_VERIFICATION_STATUS } from '@proton/shared/lib/mail/constants';

import { api } from '../../test/api';
import type { GeneratedKey } from '../../test/crypto';
import {
    fromGeneratedKeysToMessageKeys,
    generateKeys,
    releaseCryptoProxy,
    setupCryptoProxyForTesting,
} from '../../test/crypto';
import type { Download } from '../attachmentDownloader';
import {
    formatDownload,
    formatDownloadAll,
    generateDownload,
    generateDownloadAll,
    getZipAttachmentName,
} from '../attachmentDownloader';

const subject = 'Message subject';
const message = { Subject: subject };

const me = 'me@pm.me';
const attachmentName = 'Attachment Name';

const attachment1 = {
    ID: '1',
    Name: attachmentName,
    Preview: stringToUint8Array('message preview'),
    KeyPackets: encodeBase64('keypackets'),
} as Attachment;
const verification = {} as MessageVerification;
const getAttachment = jest.fn();
const onUpdateAttachment = jest.fn();

describe('formatDownload', () => {
    let toKeys: GeneratedKey;
    let messageKeys: MessageKeys;

    beforeAll(async () => {
        await setupCryptoProxyForTesting();

        toKeys = await generateKeys('me', me);

        messageKeys = fromGeneratedKeysToMessageKeys(toKeys);
    });

    afterAll(async () => {
        await releaseCryptoProxy();
    });

    it('should format download', async () => {
        const result = await formatDownload(
            attachment1,
            verification,
            messageKeys,
            api,
            getAttachment,
            onUpdateAttachment
        );

        expect(result.data).toBeDefined();
        expect(result.attachment).toEqual(attachment1);
        expect(result.verificationStatus).toEqual(MAIL_VERIFICATION_STATUS.NOT_SIGNED);
    });

    it('should return an error while formatting download when attachment is broken', async () => {
        const verificationWithError = {
            verificationErrors: [{ message: 'there is an issue' }],
        } as MessageVerification;
        const result = await formatDownload(
            { ...attachment1, Preview: undefined },
            verificationWithError,
            messageKeys,
            api,
            getAttachment,
            onUpdateAttachment
        );

        const expectedAttachment = {
            Name: `${attachmentName}.pgp`,
            MIMEType: 'application/pgp-encrypted',
            ID: '1',
        };

        expect(result.attachment).toEqual(expectedAttachment);
        expect(result.isError).toBeTruthy();
        expect(result.verificationStatus).toEqual(MAIL_VERIFICATION_STATUS.NOT_VERIFIED);
    });
});

describe('generateDownload', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should generate a download', async () => {
        const downloadFileSpy = jest.spyOn(downloadFile, 'default').mockReturnValue();

        const download = {
            attachment: {
                Name: 'attachment1',
            },
            data: stringToUint8Array('download 1 data'),
            verificationStatus: MAIL_VERIFICATION_STATUS.SIGNED_AND_VALID,
        } as Download;

        await generateDownload(download);

        const downloadAll = downloadFileSpy.mock.calls[0];
        expect(downloadFileSpy).toHaveBeenCalled();
        // Check that the spy has been called with a blob of type zip and the correct filename
        expect(downloadAll[1]).toEqual('attachment1');
    });

    it('should generate a download with the correct mimeType for firefox', async () => {
        const downloadFileSpy = jest.spyOn(downloadFile, 'default').mockReturnValue();
        jest.spyOn(browser, 'isFirefox').mockReturnValue(true);

        const download = {
            attachment: {
                Name: 'attachment1',
            },
            data: stringToUint8Array('download 1 data'),
            verificationStatus: MAIL_VERIFICATION_STATUS.SIGNED_AND_VALID,
        } as Download;

        await generateDownload(download);

        const downloadAll = downloadFileSpy.mock.calls[0];
        expect(downloadFileSpy).toHaveBeenCalled();
        // Check that the spy has been called with a blob of type zip and the correct filename
        expect(downloadAll[0]?.type).toEqual('application/octet-stream');
        expect(downloadAll[1]).toEqual('attachment1');
    });
});

describe('formatDownloadALl', () => {
    let toKeys: GeneratedKey;
    let messageKeys: MessageKeys;

    beforeAll(async () => {
        await setupCryptoProxyForTesting();

        toKeys = await generateKeys('me', me);

        messageKeys = fromGeneratedKeysToMessageKeys(toKeys);
    });

    afterAll(async () => {
        await releaseCryptoProxy();
    });

    it('should format download all', async () => {
        const result = await formatDownloadAll(
            [attachment1],
            verification,
            messageKeys,
            onUpdateAttachment,
            api,
            getAttachment
        );

        expect(result[0]?.data).toBeDefined();
        expect(result[0]?.attachment).toEqual(attachment1);
        expect(result[0]?.verificationStatus).toEqual(MAIL_VERIFICATION_STATUS.NOT_SIGNED);
    });
});

describe('getZipAttachmentName', () => {
    it('should generate a zip name for attachments', () => {
        expect(getZipAttachmentName(message)).toEqual(`Attachments-${subject}.zip`);
    });
});

describe('generateDownloadAll', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should generate a download all', async () => {
        const downloadFileSpy = jest.spyOn(downloadFile, 'default').mockReturnValue();

        const downloads = [
            {
                attachment: {
                    Name: 'attachment1',
                },
                data: stringToUint8Array('download 1 data'),
                verificationStatus: MAIL_VERIFICATION_STATUS.SIGNED_AND_VALID,
            } as Download,
            {
                attachment: {
                    Name: 'attachment2',
                },
                data: stringToUint8Array('download 2 data'),
                verificationStatus: MAIL_VERIFICATION_STATUS.SIGNED_AND_VALID,
            } as Download,
        ];

        await generateDownloadAll(message, downloads);

        const downloadAll = downloadFileSpy.mock.calls[0];

        expect(downloadFileSpy).toHaveBeenCalled();
        // Check that the spy has been called with a blob of type zip and the correct filename
        expect(downloadAll[0]?.type).toEqual('application/zip');
        expect(downloadAll[1]).toEqual(`Attachments-${subject}.zip`);
    });
});
