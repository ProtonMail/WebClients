import { type ContentBlock, type Message, Role } from '../../../types';
import { getKnowledgeFileReads, redactExcludedKnowledge } from './knowledgeReads';
import { READ_KNOWLEDGE_TOOL_NAME, SEARCH_KNOWLEDGE_TOOL_NAME } from './schema';

const call = (name: string, args: unknown = {}): ContentBlock => ({
    type: 'tool_call',
    content: JSON.stringify({ name, arguments: args }),
});
const result = (body: unknown): ContentBlock => ({ type: 'tool_result', content: JSON.stringify(body) });
const reply = (blocks: ContentBlock[]): Message =>
    ({ id: 'reply', conversationId: 'chat', role: Role.Assistant, createdAt: '2026-01-01', blocks }) as Message;

const read = (fileId: string, fileName: string, extra: object = {}) =>
    result({
        ok: true,
        file_id: fileId,
        file_name: fileName,
        page: 1,
        pages: 1,
        content: `text of ${fileName}`,
        ...extra,
    });

describe('getKnowledgeFileReads', () => {
    it('lists each file a reply read once, in reading order, skipping failed reads and searches', () => {
        const message = reply([
            call(SEARCH_KNOWLEDGE_TOOL_NAME, { query: 'captcha' }),
            result({ ok: true, results: [{ type: 'file', file_id: 'searched', file_name: 'Searched.pdf' }] }),
            call(READ_KNOWLEDGE_TOOL_NAME, { file_id: 'deck' }),
            read('deck', 'Deck.pdf'),
            call(READ_KNOWLEDGE_TOOL_NAME, { file_id: 'missing' }),
            result({ ok: false, error: 'Unknown file_id.' }),
            call(READ_KNOWLEDGE_TOOL_NAME, { file_id: 'plan' }),
            read('plan', 'Plan.pdf'),
            call(READ_KNOWLEDGE_TOOL_NAME, { file_id: 'deck', page: 2 }),
            read('deck', 'Deck.pdf', { page: 2 }),
        ]);

        expect(getKnowledgeFileReads(message)).toEqual([
            { fileId: 'deck', fileName: 'Deck.pdf' },
            { fileId: 'plan', fileName: 'Plan.pdf' },
        ]);
    });

    it('ignores other tools whose results look like a read', () => {
        expect(getKnowledgeFileReads(reply([call('some_other_tool'), read('deck', 'Deck.pdf')]))).toEqual([]);
    });
});

describe('redactExcludedKnowledge', () => {
    const excluded = new Set(['deck']);

    it('replaces reads of excluded files, and drops their search hits and mentions', () => {
        const blocks = [
            call(SEARCH_KNOWLEDGE_TOOL_NAME, { query: 'captcha' }),
            result({
                ok: true,
                results: [
                    { type: 'file', file_id: 'deck', file_name: 'Deck.pdf', snippet: 'secret' },
                    { type: 'file', file_id: 'plan', file_name: 'Plan.pdf', snippet: 'kept' },
                ],
            }),
            call(READ_KNOWLEDGE_TOOL_NAME, { file_id: 'deck' }),
            read('deck', 'Deck.pdf'),
            call(READ_KNOWLEDGE_TOOL_NAME, { file_id: 'plan' }),
            read('plan', 'Plan.pdf', { mentioned_files: [{ file_id: 'deck', file_name: 'Deck.pdf' }] }),
        ];

        const redacted = redactExcludedKnowledge(blocks, excluded);
        const text = redacted.map((block) => block.content).join('\n');
        const results = redacted.filter((block) => block.type === 'tool_result').map((block) => block.content);

        expect(text).not.toContain('secret');
        expect(text).not.toContain('text of Deck.pdf');
        expect(results.join('\n')).not.toContain('"deck"');
        expect(text).toContain('kept');
        expect(text).toContain('text of Plan.pdf');
        expect(JSON.parse(redacted[3]!.content)).toEqual({ ok: false, error: expect.stringContaining('removed') });
    });

    it('leaves everything as it was when nothing is excluded or nothing matches', () => {
        const blocks = [call(READ_KNOWLEDGE_TOOL_NAME), read('plan', 'Plan.pdf')];

        expect(redactExcludedKnowledge(blocks, new Set())).toBe(blocks);
        expect(redactExcludedKnowledge(blocks, excluded)).toBe(blocks);
    });

    it('never touches results of other tools', () => {
        const blocks = [call('some_other_tool'), read('deck', 'Deck.pdf')];

        expect(redactExcludedKnowledge(blocks, excluded)).toBe(blocks);
    });
});
