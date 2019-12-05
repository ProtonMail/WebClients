import { isConversation, isMessage } from './elements';
import { Conversation } from '../models/conversation';
import { Message } from '../models/message';

describe('elements', () => {
    describe('isConversation / isMessage', () => {
        it('should return conversation when there is no conversationID', () => {
            const element: Conversation = {};
            expect(isConversation(element)).toBe(true);
            expect(isMessage(element)).toBe(false);
        });

        it('should return message when there is a conversationID', () => {
            const element: Message = { conversationID: 'something' };
            expect(isConversation(element)).toBe(false);
            expect(isMessage(element)).toBe(true);
        });
    });
});
