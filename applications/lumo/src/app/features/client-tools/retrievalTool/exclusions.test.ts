import { type Message, Role } from '../../../types';
import { collectRetrievalExclusions } from './exclusions';

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
});
