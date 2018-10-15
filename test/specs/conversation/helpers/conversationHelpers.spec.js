import { getConversationLabels } from '../../../../src/app/conversation/helpers/conversationHelpers';

const LABEL1 = { ID: 'labelID1', ContextNumUnread: 0 };
const LABEL2 = { ID: 'labelID2', ContextNumUnread: 1 };
const LABEL3 = { ID: 'labelID3', ContextNumUnread: 0 };
const LABEL4 = { ID: 'labelID4', ContextNumUnread: 1 };
const LABELS = [LABEL1, LABEL2, LABEL3];

const CONVERSATION = {
    ContextNumUnread: 1,
    Labels: LABELS
};

describe('getConversationLabels', () => {
    it('should handle empty parameters', () => {
        expect(getConversationLabels()).toEqual([]);
    });

    it('should add a new label and remove an existing one', () => {
        const labels = getConversationLabels(CONVERSATION, { toAdd: ['labelID4'], toRemove: ['labelID3'] });

        expect(labels).toContain(LABEL4);
        expect(labels).not.toContain(LABEL3);
    });

    it('should generate uniq labels', () => {
        const labels = getConversationLabels(CONVERSATION, { toAdd: ['labelID1'], toRemove: ['labelID4'] });

        expect(labels.length).toEqual(LABELS.length);
        expect(labels).toContain(LABEL1);
        expect(labels).toContain(LABEL2);
        expect(labels).toContain(LABEL3);
        expect(labels).not.toContain(LABEL4);
    });
});
