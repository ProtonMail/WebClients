import { Attachment } from '@proton/shared/lib/interfaces/mail/Message';

import { MessageState } from '../../../logic/messages/messagesTypes';
import { getPureAttachments, updateKeyPackets } from '../attachment';

describe('updateKeyPackets', () => {
    const attachments = [
        {
            ID: 'attachment-1',
            KeyPackets: 'random-key-packet-1',
        },
    ];

    const modelMessage = {
        localID: 'modelMessage',
        data: {
            Attachments: attachments,
        },
    } as MessageState;

    it('should update attachment key packets', () => {
        const expectedAttachments = [
            {
                ID: 'attachment-1',
                KeyPackets: 'different-key-packet',
            },
        ];

        const syncedMessage = {
            localID: 'syncedMessage',
            data: {
                Attachments: expectedAttachments,
            },
        } as MessageState;

        const { changed, Attachments } = updateKeyPackets(modelMessage, syncedMessage);

        expect(changed).toBeTruthy();
        expect(Attachments).toEqual(expectedAttachments);
    });

    it('should not update KeyPackets when attachments are up to date', function () {
        const { changed, Attachments } = updateKeyPackets(modelMessage, modelMessage);

        expect(changed).toBeFalsy();
        expect(Attachments).toEqual(attachments);
    });
});

describe('getPureAttachments', () => {
    const attachments = [
        {
            Name: 'normal attachment',
            Headers: {
                'content-disposition': 'attachment',
            },
        } as Attachment,
        {
            Name: 'invalid inline image',
            Headers: {
                'content-disposition': 'inline',
            },
        } as Attachment,
        {
            Name: 'inline image',
            Headers: {
                'content-disposition': 'inline',
                'content-id': 'content-id',
            },
        } as Attachment,
    ] as Attachment[];

    it('should return all attachments when embedded images must displayed', () => {
        expect(getPureAttachments(attachments, false)).toEqual(attachments);
    });

    it('should return only pure attachments when embedded images are hidden', () => {
        expect(getPureAttachments(attachments, true)).toEqual([...attachments.slice(0, 2)]);
    });
});
