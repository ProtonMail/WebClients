import { messagesEqualForRendering } from './messageHelpers';
import messagesReducer, { setAnswerNowPrompt } from './redux/slices/core/messages';
import { type Message, Role, cleanMessage, getMessagePriv, isMessagePriv } from './types';

const status = {
    object: 'lumo.answer_now' as const,
    job_id: 'job-1',
    wait: null,
};
const message: Message = {
    id: 'm',
    conversationId: 'c',
    createdAt: '2026-10-19',
    role: Role.Assistant,
    content: 'Hello',
};

it('keeps the Answer Now prompt in memory and excludes it from persisted message fields', () => {
    const updated = messagesReducer({ m: message }, setAnswerNowPrompt({ messageId: 'm', prompt: status })).m;
    expect(getMessagePriv(updated)).not.toHaveProperty('answerNowPrompt');
    expect(updated.answerNowPrompt).toEqual(status);
    expect(cleanMessage(updated).answerNowPrompt).toEqual(status);
    expect(isMessagePriv(getMessagePriv(updated))).toBe(true);
    expect(messagesEqualForRendering(message, updated)).toBe(false);
});

it('clears the Answer Now prompt without changing the message content', () => {
    const waiting = messagesReducer({ m: message }, setAnswerNowPrompt({ messageId: 'm', prompt: status }));
    const cleared = messagesReducer(waiting, setAnswerNowPrompt({ messageId: 'm', prompt: undefined })).m;
    expect(cleared.answerNowPrompt).toBeUndefined();
    expect(cleared.content).toBe(message.content);
    expect(messagesEqualForRendering(waiting.m, cleared)).toBe(false);
});
