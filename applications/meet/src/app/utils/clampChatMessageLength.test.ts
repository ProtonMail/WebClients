import { describe, expect, it } from 'vitest';

import { CHAT_MESSAGE_MAX_LENGTH } from '../constants';
import { clampChatMessageLength } from './clampChatMessageLength';

describe('clampChatMessageLength', () => {
    it('leaves a message within the limit untouched', () => {
        expect(clampChatMessageLength('  hello  ')).toBe('  hello  ');
    });

    it('keeps a message whose trimmed content is exactly at the limit', () => {
        const value = `  ${'a'.repeat(CHAT_MESSAGE_MAX_LENGTH)}  `;

        expect(clampChatMessageLength(value)).toBe(value);
    });

    it('truncates the content that exceeds the limit while keeping the leading whitespace', () => {
        const value = `  ${'a'.repeat(CHAT_MESSAGE_MAX_LENGTH + 10)}`;

        expect(clampChatMessageLength(value)).toBe(`  ${'a'.repeat(CHAT_MESSAGE_MAX_LENGTH)}`);
    });
});
