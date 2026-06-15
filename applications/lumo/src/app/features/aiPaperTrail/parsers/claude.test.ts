import { isClaudeExport, parseClaudeExport } from './claude';

const sample = [
    {
        name: 'Health questions',
        created_at: '2024-01-02T10:00:00Z',
        chat_messages: [
            { sender: 'human', text: 'Is my blood pressure of 150/95 dangerous?' },
            { sender: 'assistant', text: 'You should see a doctor.' },
            {
                sender: 'human',
                content: [
                    { type: 'text', text: 'What about my cholesterol?' },
                    { type: 'tool_use', text: 'ignored' },
                ],
            },
        ],
    },
    {
        name: 'Legacy format',
        messages: [{ sender: 'human', text: 'Old export shape' }],
    },
];

describe('claude parser', () => {
    it('detects a Claude export', () => {
        expect(isClaudeExport(sample)).toBe(true);
        expect(isClaudeExport([{ mapping: {} }])).toBe(false);
    });

    it('keeps only human prompts and supports content blocks + legacy messages', () => {
        const result = parseClaudeExport(sample);
        expect(result.source).toBe('claude');
        expect(result.conversations).toHaveLength(2);
        expect(result.conversations[0].userPrompts).toEqual([
            'Is my blood pressure of 150/95 dangerous?',
            'What about my cholesterol?',
        ]);
        expect(result.conversations[0].createdAt).toBe(Math.floor(Date.parse('2024-01-02T10:00:00Z') / 1000));
        expect(result.conversations[1].userPrompts).toEqual(['Old export shape']);
    });
});
