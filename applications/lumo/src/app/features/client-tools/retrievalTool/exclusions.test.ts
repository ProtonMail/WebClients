import { type Message, Role } from '../../../types';
import { collectRetrievalExclusions } from './exclusions';
import { READ_KNOWLEDGE_TOOL_NAME } from './schema';

const message = (id: string, attachments: { id: string; filename: string; driveNodeId?: string }[]): Message =>
    ({ id, conversationId: 'chat', role: Role.User, createdAt: '2026-01-01', attachments }) as unknown as Message;

describe('collectRetrievalExclusions', () => {
    const chain = [
        message('first', [
            { id: 'upload', filename: 'notes.md' },
            { id: 'auto', filename: 'Contracts.pdf', driveNodeId: 'drive-node' },
        ]),
        message('second', [{ id: 'notes-again', filename: 'notes.md' }]),
    ];

    it('takes the files switched off on each message, and their index documents', () => {
        const exclusions = collectRetrievalExclusions(chain, [
            { messageId: 'first', excludedFiles: ['notes.md', 'Contracts.pdf'] },
        ]);

        expect([...exclusions.attachmentIds].sort()).toEqual(['auto', 'upload']);
        expect([...exclusions.documentIds].sort()).toEqual(['drive-node', 'upload']);
    });

    it('excludes nothing without filters', () => {
        const exclusions = collectRetrievalExclusions(chain, []);

        expect(exclusions.attachmentIds.size + exclusions.documentIds.size).toBe(0);
    });

    it('takes the files a reply read with the lookup tools and the user then switched off', () => {
        const reply = {
            id: 'reply',
            conversationId: 'chat',
            role: Role.Assistant,
            createdAt: '2026-01-01',
            blocks: [
                { type: 'tool_call', content: JSON.stringify({ name: READ_KNOWLEDGE_TOOL_NAME, arguments: {} }) },
                {
                    type: 'tool_result',
                    content: JSON.stringify({ ok: true, file_id: 'drive-plan', file_name: 'Plan.pdf', content: 'x' }),
                },
            ],
        } as unknown as Message;

        const exclusions = collectRetrievalExclusions([reply], [{ messageId: 'reply', excludedFiles: ['Plan.pdf'] }]);

        expect([...exclusions.documentIds]).toEqual(['drive-plan']);
    });
});
