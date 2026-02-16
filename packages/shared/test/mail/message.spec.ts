import type { AttachmentInfo, Message } from '../../lib/interfaces/mail/Message';
import { hasAttachments, isBounced, numAttachments } from '../../lib/mail/messages';

describe('isBounced helper', () => {
    const generateMessage = (sender: string, subject: string) =>
        ({ Sender: { Name: 'dummy', Address: sender }, Subject: subject }) as Message;

    it('should return true for the typical bounced message by Proton', () => {
        expect(
            isBounced(generateMessage('MAILER-DAEMON@protonmail.com', 'Undelivered Mail Returned to Sender'))
        ).toEqual(true);
    });

    it('should be robust with respect to changes in the email sender and subject', () => {
        expect(isBounced(generateMessage('mailer-daemon@proton.ch', 'Delivery Status Notification (Failure)'))).toEqual(
            true
        );
    });

    it('should return false if the sender is not mailer-daemon', () => {
        expect(isBounced(generateMessage('me@protonmail.com', 'Undelivered Mail Returned to Sender'))).toEqual(false);
    });

    it('should return false if the subject is not about an undelivered message', () => {
        expect(isBounced(generateMessage('MAILER-DAEMON@protonmail.com', 'Do you like fishing?'))).toEqual(false);
    });
});

describe('numAttachments', () => {
    it('should return NumAttachments when present', () => {
        const message = { NumAttachments: 3 } as Partial<Message>;
        expect(numAttachments(message)).toBe(3);
    });

    it('should fall back to AttachmentInfo when NumAttachments is 0', () => {
        const message = {
            NumAttachments: 0,
            AttachmentInfo: {
                'application/pdf': { attachment: 2 },
            } as Partial<Record<string, AttachmentInfo>>,
        } as Partial<Message>;
        expect(numAttachments(message)).toBe(2);
    });

    it('should sum attachment counts across multiple mime types', () => {
        const message = {
            NumAttachments: 0,
            AttachmentInfo: {
                'image/png': { attachment: 1 },
                'application/pdf': { attachment: 2 },
            } as Partial<Record<string, AttachmentInfo>>,
        } as Partial<Message>;
        expect(numAttachments(message)).toBe(3);
    });

    it('should return 0 when both NumAttachments and AttachmentInfo are missing', () => {
        const message = {} as Partial<Message>;
        expect(numAttachments(message)).toBe(0);
    });

    it('should return 0 when message is undefined', () => {
        expect(numAttachments(undefined)).toBe(0);
    });

    it('should return 0 when AttachmentInfo has zero attachments', () => {
        const message = {
            NumAttachments: 0,
            AttachmentInfo: {
                'image/png': { attachment: 0 },
            } as Partial<Record<string, AttachmentInfo>>,
        } as Partial<Message>;
        expect(numAttachments(message)).toBe(0);
    });
});

describe('hasAttachments', () => {
    it('should return true when numAttachments > 0', () => {
        const message = { NumAttachments: 1 } as Partial<Message>;
        expect(hasAttachments(message)).toBe(true);
    });

    it('should return false when numAttachments is 0', () => {
        const message = {} as Partial<Message>;
        expect(hasAttachments(message)).toBe(false);
    });

    it('should return true when NumAttachments is missing but AttachmentInfo has attachments', () => {
        const message = {
            NumAttachments: 0,
            AttachmentInfo: {
                'application/pdf': { attachment: 1 },
            } as Partial<Record<string, AttachmentInfo>>,
        } as Partial<Message>;
        expect(hasAttachments(message)).toBe(true);
    });

    it('should return false when AttachmentInfo has zero attachments', () => {
        const message = {
            NumAttachments: 0,
            AttachmentInfo: {
                'image/png': { attachment: 0 },
            } as Partial<Record<string, AttachmentInfo>>,
        } as Partial<Message>;
        expect(hasAttachments(message)).toBe(false);
    });
});
