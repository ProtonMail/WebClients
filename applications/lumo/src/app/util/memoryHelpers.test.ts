import type { Memory } from '../redux/slices/lumoUserSettings';
import type { Conversation, Message, Space } from '../types';
import { Role } from '../types';
import {
    applyMemoryEdit,
    buildMemoryBootstrapPrompt,
    mergeAppendedGeneratedMemories,
    parseMemoryStringsResponse,
    partitionMemories,
    sampleUserPromptsForMemoryGeneration,
} from './memoryHelpers';

const makeMessage = (overrides: Partial<Message> & Pick<Message, 'id' | 'conversationId' | 'content'>): Message =>
    ({
        createdAt: '2026-01-01T00:00:00.000Z',
        role: Role.User,
        status: 'succeeded',
        ...overrides,
    }) as Message;

describe('memoryHelpers', () => {
    it('samples only general-chat user prompts, newest first, deduped', () => {
        const spaces: Record<string, Space> = {
            project: { id: 'project', isProject: true } as Space,
            general: { id: 'general', isProject: false } as Space,
        };
        const conversations: Record<string, Conversation> = {
            c1: { id: 'c1', spaceId: 'general' } as Conversation,
            c2: { id: 'c2', spaceId: 'project' } as Conversation,
        };
        const messages: Record<string, Message> = {
            m1: makeMessage({
                id: 'm1',
                conversationId: 'c1',
                content: 'I prefer concise answers and short summaries in all responses please',
                createdAt: '2026-01-02T00:00:00.000Z',
            }),
            m2: makeMessage({
                id: 'm2',
                conversationId: 'c2',
                content: 'Project-only prompt should be excluded from memory generation sampling',
                createdAt: '2026-01-03T00:00:00.000Z',
            }),
            m3: makeMessage({
                id: 'm3',
                conversationId: 'c1',
                content: 'I prefer concise answers and short summaries in all responses please',
                createdAt: '2026-01-01T00:00:00.000Z',
            }),
        };

        expect(sampleUserPromptsForMemoryGeneration(messages, conversations, spaces)).toEqual([
            'I prefer concise answers and short summaries in all responses please',
        ]);
    });

    it('parses JSON string array from model response', () => {
        const raw = 'Here you go:\n["Likes bullet points", "Works in product design"]\n';
        expect(parseMemoryStringsResponse(raw)).toEqual(['Likes bullet points', 'Works in product design']);
    });

    it('drops exact (case-insensitive) duplicates when parsing', () => {
        const raw = '["Likes bullet points", "likes BULLET points", "Works in product design"]';
        expect(parseMemoryStringsResponse(raw)).toEqual(['Likes bullet points', 'Works in product design']);
    });

    it('merges appended generated without duplicate text', () => {
        const existing: Memory[] = [{ id: '1', content: 'Existing', createdAt: 1, source: 'user' }];
        const generated: Memory[] = [
            { id: '2', content: 'Existing', createdAt: 2, source: 'generated' },
            { id: '3', content: 'New memory', createdAt: 3, source: 'generated' },
        ];
        expect(mergeAppendedGeneratedMemories(existing, generated)).toHaveLength(2);
    });

    it('builds a fresh-bootstrap prompt with no existing-memories block when none are saved', () => {
        const prompt = buildMemoryBootstrapPrompt(['Sample A', 'Sample B']);
        expect(prompt).toContain('Sample A');
        expect(prompt).toContain('ONLY a JSON array');
        expect(prompt).toContain('from scratch');
        expect(prompt).not.toContain('do NOT repeat or paraphrase');
        expect(prompt).not.toContain('(none)');
    });

    it('builds an incremental prompt that lists existing memories when present', () => {
        const existing: Memory[] = [
            { id: '1', content: 'Prefers concise answers', createdAt: 1, source: 'user' },
            { id: '2', content: 'Works in product design', createdAt: 2, source: 'generated' },
        ];
        const prompt = buildMemoryBootstrapPrompt(['Sample A'], existing);
        expect(prompt).toContain('Prefers concise answers');
        expect(prompt).toContain('Works in product design');
        expect(prompt).toContain('do NOT repeat or paraphrase');
        expect(prompt).toContain('incrementally update');
    });

    it('partitions legacy memories without source as user', () => {
        const memories: Memory[] = [{ id: '1', content: 'Legacy', createdAt: 1 }];
        expect(partitionMemories(memories).user).toHaveLength(1);
        expect(partitionMemories(memories).generated).toHaveLength(0);
    });

    it('promotes a generated memory to user on edit', () => {
        const memory: Memory = { id: '1', content: 'Likes bullet points', createdAt: 1, source: 'generated' };
        const edited = applyMemoryEdit(memory, 'Prefers concise bullet points');
        expect(edited.source).toBe('user');
        expect(edited.content).toBe('Prefers concise bullet points');
        expect(edited.id).toBe('1');
        expect(edited.createdAt).toBe(1);
    });
});
