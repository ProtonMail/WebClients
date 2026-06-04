import { ENABLE_U2L_ENCRYPTION, prepareTurns } from './index';
import type { ConversationContext } from '../components/Conversation/helper';
import type { Attachment, Message } from '../types';
import { Role } from '../types';
import type { PersonalizationSettings } from '../redux/slices/personalization';

describe('llm encryption configuration', () => {
    it('enables U2L encryption', () => {
        expect(ENABLE_U2L_ENCRYPTION).toBe(true);
    });
});

describe('prepareTurns — attachment content blocks', () => {
    const personalization = {} as PersonalizationSettings;

    const makeUserMessage = (attachmentIds: string[]): Message =>
        ({
            id: 'msg-1',
            role: Role.User,
            content: 'is there anything else in the file?',
            conversationId: 'conv-1',
            attachments: attachmentIds.map((id) => ({ id, filename: `${id}.pdf`, mimeType: 'application/pdf' })),
        }) as unknown as Message;

    const makeContext = (allConversationAttachments: Attachment[]): ConversationContext =>
        ({
            spaceId: 'space-1',
            conversationId: 'conv-1',
            allConversationAttachments,
            messageChain: [],
            contextFilters: [],
        }) as unknown as ConversationContext;

    it('emits a BEGIN/END FILE CONTENTS block when the attachment has markdown', () => {
        const message = makeUserMessage(['receipt']);
        const attachment = {
            id: 'receipt',
            filename: 'receipt.pdf',
            mimeType: 'application/pdf',
            markdown: 'Total: £40.50',
        } as unknown as Attachment;

        const turns = prepareTurns([message], personalization, undefined, makeContext([attachment]));

        const joined = turns.map((t) => t.content).join('\n');
        expect(joined).toContain('----- BEGIN FILE CONTENTS -----');
        expect(joined).toContain('Total: £40.50');
        expect(joined).toContain('----- END FILE CONTENTS -----');
    });

    it('does NOT emit an empty file block when the attachment has no content (RAG/project file)', () => {
        const message = makeUserMessage(['receipt']);
        const attachment = {
            id: 'receipt',
            filename: 'receipt.pdf',
            mimeType: 'application/pdf',
            // No markdown — content lives in the RAG index, not on the attachment.
        } as unknown as Attachment;

        const turns = prepareTurns([message], personalization, undefined, makeContext([attachment]));

        const joined = turns.map((t) => t.content).join('\n');
        expect(joined).not.toContain('BEGIN FILE CONTENTS');
        expect(joined).not.toContain('END FILE CONTENTS');
    });

    it('emits an error note when the attachment failed to process', () => {
        const message = makeUserMessage(['broken']);
        const attachment = {
            id: 'broken',
            filename: 'broken.pdf',
            mimeType: 'application/pdf',
            error: true,
        } as unknown as Attachment;

        const turns = prepareTurns([message], personalization, undefined, makeContext([attachment]));

        const joined = turns.map((t) => t.content).join('\n');
        expect(joined).toContain('[Contents not available');
    });
});
