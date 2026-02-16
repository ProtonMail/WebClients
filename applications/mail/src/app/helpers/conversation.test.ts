import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import type { AttachmentInfo } from '@proton/shared/lib/interfaces/mail/Message';

import type { Conversation } from 'proton-mail/models/conversation';

import { getLabelsSetForConversation, getNumAttachments, hasAttachments } from './conversation';

describe('ConversationHelper', () => {
    describe('getLabelsMapForConversation', () => {
        it('should return empty Set if conversation is null', () => {
            const result = getLabelsSetForConversation(undefined);
            expect(result).toEqual(new Set());
        });

        it('should return empty Set if no labels in conversation', () => {
            const conversation = {} as unknown as Conversation;
            const result = getLabelsSetForConversation(conversation);
            expect(result).toEqual(new Set());
        });

        it('should return Set with all label IDs', () => {
            const conversation = {
                Labels: [
                    { ID: MAILBOX_LABEL_IDS.INBOX, Name: 'Label1' },
                    { ID: MAILBOX_LABEL_IDS.ALL_MAIL, Name: 'Label2' },
                ],
            } as unknown as Conversation;
            const result = getLabelsSetForConversation(conversation);
            expect(result).toEqual(new Set([MAILBOX_LABEL_IDS.INBOX, MAILBOX_LABEL_IDS.ALL_MAIL]));
        });
    });

    describe('getNumAttachments', () => {
        it('should return NumAttachments when present', () => {
            const conversation = { NumAttachments: 5 } as Conversation;
            expect(getNumAttachments(conversation)).toBe(5);
        });

        it('should fall back to AttachmentInfo when NumAttachments is missing', () => {
            const conversation = {
                AttachmentInfo: {
                    'application/pdf': { attachment: 3 },
                } as Partial<Record<string, AttachmentInfo>>,
            } as Conversation;
            expect(getNumAttachments(conversation)).toBe(3);
        });

        it('should sum attachment counts across multiple mime types', () => {
            const conversation = {
                AttachmentInfo: {
                    'image/png': { attachment: 1 },
                    'application/pdf': { attachment: 2 },
                } as Partial<Record<string, AttachmentInfo>>,
            } as Conversation;
            expect(getNumAttachments(conversation)).toBe(3);
        });

        it('should return 0 when both NumAttachments and AttachmentInfo are missing', () => {
            const conversation = {} as Conversation;
            expect(getNumAttachments(conversation)).toBe(0);
        });

        it('should return 0 when conversation is undefined', () => {
            expect(getNumAttachments(undefined)).toBe(0);
        });

        it('should return 0 when AttachmentInfo has zero attachments', () => {
            const conversation = {
                AttachmentInfo: {
                    'image/png': { attachment: 0 },
                } as Partial<Record<string, AttachmentInfo>>,
            } as Conversation;
            expect(getNumAttachments(conversation)).toBe(0);
        });
    });

    describe('hasAttachments', () => {
        it('should return true when NumAttachments > 0', () => {
            const conversation = { NumAttachments: 2 } as Conversation;
            expect(hasAttachments(conversation)).toBe(true);
        });

        it('should return false when conversation has no attachments', () => {
            const conversation = {} as Conversation;
            expect(hasAttachments(conversation)).toBe(false);
        });

        it('should return true when NumAttachments is missing but AttachmentInfo has attachments', () => {
            const conversation = {
                AttachmentInfo: {
                    'application/pdf': { attachment: 1 },
                } as Partial<Record<string, AttachmentInfo>>,
            } as Conversation;
            expect(hasAttachments(conversation)).toBe(true);
        });

        it('should return false when AttachmentInfo has zero attachments', () => {
            const conversation = {
                AttachmentInfo: {
                    'image/png': { attachment: 0 },
                } as Partial<Record<string, AttachmentInfo>>,
            } as Conversation;
            expect(hasAttachments(conversation)).toBe(false);
        });
    });
});
