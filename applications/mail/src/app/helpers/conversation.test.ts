import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';

import type { Conversation } from 'proton-mail/models/conversation';

import { getLabelsSetForConversation } from './conversation';

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
});
