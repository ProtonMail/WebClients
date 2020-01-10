import { isConversation, isMessage, sort } from './elements';
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
            const element: Message = { ConversationID: 'something' };
            expect(isConversation(element)).toBe(false);
            expect(isMessage(element)).toBe(true);
        });
    });

    describe('sort', () => {
        it('should sort by time', () => {
            const elements = [{ ContextTime: 1 }, { ContextTime: 2 }, { ContextTime: 3 }];
            expect(sort(elements, { sort: 'Time', desc: false }, 'labelID')).toEqual(elements);
        });
        it('should sort by time desc', () => {
            const elements = [{ ContextTime: 1 }, { ContextTime: 2 }, { ContextTime: 3 }];
            expect(sort(elements, { sort: 'Time', desc: true }, 'labelID')).toEqual([...elements].reverse());
        });
        it('should sort by time and fallback on order', () => {
            const elements = [
                { ContextTime: 1, Order: 3 },
                { ContextTime: 1, Order: 2 },
                { ContextTime: 1, Order: 1 }
            ];
            expect(sort(elements, { sort: 'Time', desc: false }, 'labelID')).toEqual([...elements].reverse());
        });
        it('should sort by size', () => {
            const elements = [{ Size: 1 }, { Size: 2 }, { Size: 3 }];
            expect(sort(elements, { sort: 'Size', desc: false }, 'labelID')).toEqual(elements);
        });
    });
});
