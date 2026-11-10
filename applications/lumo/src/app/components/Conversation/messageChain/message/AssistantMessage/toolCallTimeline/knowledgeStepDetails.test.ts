import {
    READ_KNOWLEDGE_TOOL_NAME,
    SEARCH_KNOWLEDGE_TOOL_NAME,
} from '../../../../../../features/client-tools/retrievalTool/schema';
import { getKnowledgeStepDetails } from './knowledgeStepDetails';

const search = (results: unknown[], query = 'gulag proposal') =>
    getKnowledgeStepDetails(
        SEARCH_KNOWLEDGE_TOOL_NAME,
        JSON.stringify({ query }),
        JSON.stringify({ ok: true, results })
    );

describe('getKnowledgeStepDetails', () => {
    it('lists the files and chats a search found', () => {
        const details = search([
            { type: 'file', file_name: 'plan.pdf', page: 2, pages: 5, snippet: 'secret' },
            { type: 'message', message_id: 'm1', chat_title: 'Proposals', date: '2026-10-23', snippet: 'secret' },
            { type: 'message', message_id: 'm2', in_this_chat: true, date: '2026-11-02' },
        ]);

        expect(details).toEqual({
            query: 'gulag proposal',
            items: [
                { kind: 'file', name: 'plan.pdf', page: 2, pages: 5 },
                { kind: 'chat', title: 'Proposals', date: '2026-10-23', messageId: 'm1', inThisChat: false },
                { kind: 'chat', title: undefined, date: '2026-11-02', messageId: undefined, inThisChat: true },
            ],
            more: 0,
            noMatches: false,
            readsChat: false,
            analyzesFile: false,
            callId: undefined,
        });
    });

    it('lists a chat once however many of its messages matched', () => {
        const details = search([
            { type: 'message', message_id: 'm1', chat_title: 'Proposals', date: '2026-10-23' },
            { type: 'message', message_id: 'm2', chat_title: 'Proposals', date: '2026-10-23' },
        ]);

        expect(details.items).toHaveLength(1);
    });

    it('caps the list and counts the rest', () => {
        const details = search(
            Array.from({ length: 9 }, (_, index) => ({ type: 'file', file_name: `file-${index}.txt` }))
        );

        expect(details.items).toHaveLength(6);
        expect(details.more).toBe(3);
    });

    it('says when a search found nothing', () => {
        expect(search([]).noMatches).toBe(true);
    });

    it('shows only the query of a failed search', () => {
        const details = getKnowledgeStepDetails(
            SEARCH_KNOWLEDGE_TOOL_NAME,
            { query: 'proposal' },
            JSON.stringify({ ok: false, error: 'Search is unavailable' })
        );

        expect(details).toEqual({
            query: 'proposal',
            items: [],
            more: 0,
            noMatches: false,
            readsChat: false,
            analyzesFile: false,
            callId: undefined,
        });
    });

    it('marks a read of a chat message, before and after it returns', () => {
        expect(
            getKnowledgeStepDetails(READ_KNOWLEDGE_TOOL_NAME, JSON.stringify({ message_id: 'm1' }), undefined).readsChat
        ).toBe(true);

        const details = getKnowledgeStepDetails(
            READ_KNOWLEDGE_TOOL_NAME,
            JSON.stringify({ message_id: 'm1' }),
            JSON.stringify({ ok: true, message_id: 'm1', chat_title: 'Proposals', date: '2026-10-23', content: 'x' })
        );
        expect(details.readsChat).toBe(true);
        expect(details.items).toEqual([
            { kind: 'chat', title: 'Proposals', date: '2026-10-23', messageId: 'm1', inThisChat: false },
        ]);
    });

    it('treats a read of a file as a file', () => {
        const details = getKnowledgeStepDetails(
            READ_KNOWLEDGE_TOOL_NAME,
            JSON.stringify({ file_id: 'f1' }),
            JSON.stringify({ ok: true, file_name: 'plan.pdf', page: 1, pages: 1, content: 'x' })
        );

        expect(details.readsChat).toBe(false);
        expect(details.items).toEqual([{ kind: 'file', name: 'plan.pdf', page: 1, pages: 1 }]);
    });

    it('ignores arguments and results that are not JSON objects', () => {
        expect(getKnowledgeStepDetails(SEARCH_KNOWLEDGE_TOOL_NAME, '{not json', '[1, 2]')).toEqual({
            query: undefined,
            items: [],
            more: 0,
            noMatches: false,
            readsChat: false,
            analyzesFile: false,
            callId: undefined,
        });
    });
});
