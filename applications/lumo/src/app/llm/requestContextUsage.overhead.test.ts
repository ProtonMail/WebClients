import { Role } from '../types';
import { estimateRequestContextUsage } from './requestContextUsage';

it('reserves the server system prompt even when the client sends no turns or tools', () => {
    expect(estimateRequestContextUsage([])).toEqual({
        conversationTokens: 0,
        toolCallTokens: 0,
        instructionTokens: 4_000,
        fileTokens: 0,
        usedTokens: 4_000,
    });
});

it('adds client instructions and history on top of the server system prompt once', () => {
    expect(
        estimateRequestContextUsage([
            { role: Role.System, content: 'Be brief.' },
            { role: Role.User, content: 'Question' },
        ])
    ).toEqual({
        conversationTokens: 2,
        toolCallTokens: 0,
        instructionTokens: 4_003,
        fileTokens: 0,
        usedTokens: 4_005,
    });
});
