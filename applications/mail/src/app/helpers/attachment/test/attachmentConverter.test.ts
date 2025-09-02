import type { MIMEAttachment } from '@proton/crypto';
import { stringToUint8Array } from '@proton/shared/lib/helpers/encoding';
import type { Message } from '@proton/shared/lib/interfaces/mail/Message';
import { ATTACHMENT_DISPOSITION, MAIL_VERIFICATION_STATUS } from '@proton/shared/lib/mail/constants';

import type { DecryptedAttachment } from 'proton-mail/store/attachments/attachmentsTypes';

import { ENCRYPTED_STATUS } from '../../../constants';
import { ID_PREFIX, convert, convertSingle, convertToFile, getHeaders, getId } from '../attachmentConverter';

const fileName = 'fileName';
const messageID = 'messageID';
const contentID = 'contentID';
const contentDisposition = ATTACHMENT_DISPOSITION.INLINE;

const message = { ID: messageID } as Message;

const originalHeaders = {
    'content-id': [contentID],
};
const attachmentSize = 222;

const mimeAttachment = {
    contentId: contentID,
    fileName,
    contentDisposition,
    contentType: '',
    headers: originalHeaders,
    size: attachmentSize,
    content: stringToUint8Array('content'),
} as MIMEAttachment;

describe('getId', () => {
    it('should return the expected attachment ID', function () {
        const number = 1;
        const parsedAttachment = { contentId: contentID } as MIMEAttachment;

        const expected = `${ID_PREFIX}_${messageID}_${contentID}_${number}`;
        expect(getId(message, parsedAttachment, number)).toEqual(expected);
    });
});

describe('getHeaders', () => {
    it('should return attachment headers', () => {
        const expected = {
            'content-disposition': `${contentDisposition}; filename="${fileName}"`,
            'content-id': contentID,
            'content-type': `; filename="${fileName}"`,
            embedded: 1,
        };

        expect(getHeaders(mimeAttachment)).toEqual(expected);
    });
});

describe('convertSingle', () => {
    it('should convert a single parsed attachment to an attachment', () => {
        const spy = jest.fn();

        const attachment = convertSingle(message, mimeAttachment, 1, spy);

        const expectedAttachment = {
            Encrypted: ENCRYPTED_STATUS.PGP_MIME,
            ID: getId(message, mimeAttachment, 1),
            Headers: {
                'content-disposition': `${contentDisposition}; filename="${fileName}"`,
                'content-id': contentID,
                'content-type': `; filename="${fileName}"`,
                embedded: 1,
            },
            Name: fileName,
            KeyPackets: null,
            MIMEType: '',
            Size: attachmentSize,
        };

        expect(attachment).toEqual(expectedAttachment);
        expect(spy).toHaveBeenCalled();
    });
});

describe('convert', () => {
    it('should convert multiple parsed attachments to attachment', function () {
        const spy = jest.fn();

        const mimeAttachment2 = {
            contentId: `${contentID}-2`,
            fileName: `${fileName}-2`,
            contentDisposition,
            contentType: '',
            headers: originalHeaders,
            size: attachmentSize,
            content: stringToUint8Array('content-2'),
        } as MIMEAttachment;

        const attachments = convert(message, [mimeAttachment, mimeAttachment2], spy);

        const expectedAttachments = [
            {
                Encrypted: ENCRYPTED_STATUS.PGP_MIME,
                ID: getId(message, mimeAttachment, 0),
                Headers: {
                    'content-disposition': `${contentDisposition}; filename="${fileName}"`,
                    'content-id': contentID,
                    'content-type': `; filename="${fileName}"`,
                    embedded: 1,
                },
                Name: fileName,
                KeyPackets: null,
                MIMEType: '',
                Size: attachmentSize,
            },
            {
                Encrypted: ENCRYPTED_STATUS.PGP_MIME,
                ID: getId(message, mimeAttachment2, 1),
                Headers: {
                    'content-disposition': `${contentDisposition}; filename="${fileName}-2"`,
                    'content-id': contentID,
                    'content-type': `; filename="${fileName}-2"`,
                    embedded: 1,
                },
                Name: `${fileName}-2`,
                KeyPackets: null,
                MIMEType: '',
                Size: attachmentSize,
            },
        ];

        expect(attachments).toEqual(expectedAttachments);
        expect(spy).toHaveBeenCalledTimes(2);
    });
});

describe('convertToFile', () => {
    it('should return normal attachments and convert to file pgp attachments', () => {
        const spy = jest.fn((ID: string) => {
            return {
                filename: 'attachment-2',
                verificationStatus: MAIL_VERIFICATION_STATUS.SIGNED_AND_VALID,
                data: stringToUint8Array(`content-${ID}`),
                signatures: [stringToUint8Array(`content-${ID}`)],
            } as DecryptedAttachment;
        });
        const attachments = [
            { ID: 'attachment-1' },
            {
                ID: `${ID_PREFIX}-attachment-2`,
                Name: 'attachment-2',
                MIMEType: 'attachment',
            },
        ];

        const expected = [{ ID: 'attachment-1' }];

        const result = convertToFile(attachments, spy);

        expect(result[0]).toEqual(expected);
        expect(result[1][0].name).toEqual('attachment-2');
    });
});
