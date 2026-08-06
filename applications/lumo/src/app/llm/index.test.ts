import type { ConversationContext } from '../components/Conversation/helper';
import type { PersonalizationSettings } from '../redux/slices/personalization';
import { attachmentDataCache } from '../services/attachmentDataCache';
import type { Attachment, Message } from '../types';
import { Role } from '../types';
import { ENABLE_U2L_ENCRYPTION } from './config';
import { prepareTurns } from './index';

describe('llm encryption configuration', () => {
    it('enables U2L encryption', () => {
        expect(ENABLE_U2L_ENCRYPTION).toBe(true);
    });
});

describe('prepareTurns — artifact tool nudge', () => {
    const personalization = {} as PersonalizationSettings;
    const message = {
        id: 'msg-1',
        role: Role.User,
        content: 'hello',
        conversationId: 'conv-1',
    } as unknown as Message;

    it('injects no nudge turn when artifactToolMode is "off" (the default)', () => {
        const turns = prepareTurns([message], personalization);
        expect(turns.some((turn) => turn.role === Role.System && turn.content?.includes('create_artifact'))).toBe(
            false
        );
    });

    it('injects the create-mode nudge when artifactToolMode is "create"', () => {
        const turns = prepareTurns(
            [message],
            personalization,
            undefined,
            undefined,
            undefined,
            undefined,
            false,
            'create'
        );
        const nudge = turns.find((turn) => turn.role === Role.System && turn.content?.includes('create_artifact'));
        expect(nudge?.content).toContain('activated Create Artifact mode');
    });

    it('injects the revise-only nudge when artifactToolMode is "revise"', () => {
        const turns = prepareTurns(
            [message],
            personalization,
            undefined,
            undefined,
            undefined,
            undefined,
            false,
            'revise'
        );
        const nudge = turns.find((turn) => turn.role === Role.System && turn.content?.includes('create_artifact'));
        expect(nudge?.content).toContain('only to revise');
        expect(nudge?.content).not.toContain('activated Create Artifact mode');
    });
});

describe('prepareTurns — attachment content blocks', () => {
    const personalization = {} as PersonalizationSettings;

    it('prepends visualization instructions when enabled', () => {
        const message = {
            id: 'msg-1',
            role: Role.User,
            content: 'hello',
            conversationId: 'conv-1',
        } as unknown as Message;

        const turns = prepareTurns([message], personalization, undefined, undefined, undefined, undefined, true);
        expect(turns[0]?.role).toBe(Role.System);
        expect(turns[0]?.content).toContain('[Visualization]');
        expect(turns[0]?.content).toContain('vega-lite');
    });

    it('omits visualization instructions when disabled', () => {
        const message = {
            id: 'msg-1',
            role: Role.User,
            content: 'hello',
            conversationId: 'conv-1',
        } as unknown as Message;

        const turns = prepareTurns([message], personalization, undefined, undefined, undefined, undefined, false);
        expect(turns.some((turn) => turn.content?.includes('[Visualization]'))).toBe(false);
    });

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

describe('prepareTurns — image attachments', () => {
    const personalization = {} as PersonalizationSettings;

    const makeContext = (allConversationAttachments: Attachment[]): ConversationContext =>
        ({
            spaceId: 'space-1',
            conversationId: 'conv-1',
            allConversationAttachments,
            messageChain: [],
            contextFilters: [],
        }) as unknown as ConversationContext;

    const makeImageMessage = (ids: string[]): Message =>
        ({
            id: 'msg-1',
            role: Role.User,
            content: 'describe these',
            conversationId: 'conv-1',
            attachments: ids.map((id) => ({ id, filename: `${id}.png`, mimeType: 'image/png' })),
        }) as unknown as Message;

    const makeImageAttachment = (id: string): Attachment =>
        ({ id, filename: `${id}.png`, mimeType: 'image/png' }) as unknown as Attachment;

    beforeEach(() => {
        jest.spyOn(attachmentDataCache, 'getData').mockImplementation(() => new Uint8Array([1, 2, 3]));
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('groups multiple images into a single turn instead of one turn per image', () => {
        const ids = ['a', 'b', 'c'];
        const message = makeImageMessage(ids);

        const turns = prepareTurns([message], personalization, undefined, makeContext(ids.map(makeImageAttachment)));

        const imageTurns = turns.filter((t) => Array.isArray(t.images) && t.images.length > 0);
        expect(imageTurns).toHaveLength(1);
        expect(imageTurns[0].images).toHaveLength(3);
        // Image markers and the user's message text are merged into the same turn
        // so the backend can co-locate each <lumo-image> marker with its image_url bytes.
        expect(imageTurns[0].content).toContain('describe these');
        expect(imageTurns[0].content).toContain('<lumo-image id="a" source="user" name="a.png"');
        expect(imageTurns[0].content).toContain('<lumo-image id="b" source="user" name="b.png"');
        expect(imageTurns[0].content).toContain('<lumo-image id="c" source="user" name="c.png"');
    });
});
