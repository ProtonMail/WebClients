import { Message } from 'proton-shared/lib/interfaces/mail/Message';
import { Conversation } from '../models/conversation';
import {
    applyLabelChangesOnMessage,
    applyLabelChangesOnConversation,
    applyLabelChangesOnOneMessageOfAConversation
} from './labels';

const labelID = 'LabelID';

describe('labels', () => {
    describe('applyLabelChangesOnMessage', () => {
        it('should remove a label from a message', () => {
            const input = ({
                LabelIDs: [labelID]
            } as unknown) as Message;
            const changes = { [labelID]: false };

            const message = applyLabelChangesOnMessage(input, changes);

            expect(message.LabelIDs?.length).toBe(0);
        });

        it('should add a label for a message', () => {
            const input = ({
                LabelIDs: []
            } as unknown) as Message;
            const changes = { [labelID]: true };

            const message = applyLabelChangesOnMessage(input, changes);

            expect(message.LabelIDs?.length).toBe(1);
            expect(message.LabelIDs[0]).toBe(labelID);
        });
    });

    describe('applyLabelChangesOnConversation', () => {
        it('should remove a label from a conversation', () => {
            const input = {
                Labels: [{ ID: labelID, ContextNumMessages: 5 }]
            } as Conversation;
            const changes = { [labelID]: false };

            const conversation = applyLabelChangesOnConversation(input, changes);

            expect(conversation.Labels?.length).toBe(0);
        });

        it('should add a label for a conversation', () => {
            const input = {
                Labels: []
            } as Conversation;
            const changes = { [labelID]: true };

            const conversation = applyLabelChangesOnConversation(input, changes);

            expect(conversation.Labels?.length).toBe(1);
        });
    });

    describe('applyLabelChangesOnOneMessageOfAConversation', () => {
        it('should remove a label from a conversation when remove the label on the last message having it', () => {
            const input = {
                Labels: [{ ID: labelID, ContextNumMessages: 1 }]
            } as Conversation;
            const changes = { [labelID]: false };

            const conversation = applyLabelChangesOnOneMessageOfAConversation(input, changes);

            expect(conversation.Labels?.length).toBe(0);
        });

        it('should keep a label from a conversation when remove the label on a message but not the last having it', () => {
            const numMessages = 3;
            const input = {
                Labels: [{ ID: labelID, ContextNumMessages: numMessages }]
            } as Conversation;
            const changes = { [labelID]: false };

            const conversation = applyLabelChangesOnOneMessageOfAConversation(input, changes);

            expect(conversation.Labels?.length).toBe(1);
            expect(conversation.Labels?.[0].ContextNumMessages).toBe(numMessages - 1);
        });

        it('should add a label to a conversation when adding the label to the first message having it', () => {
            const input = {
                Labels: []
            } as Conversation;
            const changes = { [labelID]: true };

            const conversation = applyLabelChangesOnOneMessageOfAConversation(input, changes);

            expect(conversation.Labels?.length).toBe(1);
            expect(conversation.Labels?.[0].ContextNumMessages).toBe(1);
        });

        it('should keep a label to a conversation when adding the label to a message but not the first having it', () => {
            const numMessages = 3;
            const input = {
                Labels: [{ ID: labelID, ContextNumMessages: numMessages }]
            } as Conversation;
            const changes = { [labelID]: true };

            const conversation = applyLabelChangesOnOneMessageOfAConversation(input, changes);

            expect(conversation.Labels?.length).toBe(1);
            expect(conversation.Labels?.[0].ContextNumMessages).toBe(numMessages + 1);
        });
    });
});
