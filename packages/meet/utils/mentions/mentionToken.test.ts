import { describe, expect, it } from 'vitest';

import {
    EVERYONE_MENTION_ID,
    getMentionToken,
    isParticipantMentioned,
    splitMessageIntoMentionSegments,
} from './mentionToken';

const ALICE = 'aaaaaaaa-1111-2222-3333-444444444444';
const ROBERT = 'bbbbbbbb-1111-2222-3333-444444444444';

describe('splitMessageIntoMentionSegments', () => {
    it('returns a single text segment when there is no mention', () => {
        expect(splitMessageIntoMentionSegments('hello there')).toEqual([{ type: 'text', text: 'hello there' }]);
    });

    it('returns an empty list for an empty message', () => {
        expect(splitMessageIntoMentionSegments('')).toEqual([]);
    });

    it('splits the text around a mention', () => {
        expect(splitMessageIntoMentionSegments(`hi ${getMentionToken(ALICE)} there`)).toEqual([
            { type: 'text', text: 'hi ' },
            { type: 'mention', id: ALICE },
            { type: 'text', text: ' there' },
        ]);
    });

    it('keeps adjacent mentions separate', () => {
        expect(splitMessageIntoMentionSegments(`${getMentionToken(ALICE)}${getMentionToken(ROBERT)}`)).toEqual([
            { type: 'mention', id: ALICE },
            { type: 'mention', id: ROBERT },
        ]);
    });

    it('treats a token-looking string with whitespace in the id as plain text', () => {
        const message = '[participant_uuid:not an id]';

        expect(splitMessageIntoMentionSegments(message)).toEqual([{ type: 'text', text: message }]);
    });

    it('treats a token whose id is not a participant uuid as plain text', () => {
        const message = '[participant_uuid:aaaaaaaa-1111-2222-3333]';

        expect(splitMessageIntoMentionSegments(message)).toEqual([{ type: 'text', text: message }]);
    });

    it('treats a token whose id has non hexadecimal characters as plain text', () => {
        const message = '[participant_uuid:zzzzzzzz-1111-2222-3333-444444444444]';

        expect(splitMessageIntoMentionSegments(message)).toEqual([{ type: 'text', text: message }]);
    });

    it('does not let an unterminated token swallow the rest of the message', () => {
        const message = `[participant_uuid:${ALICE} and then some more text`;

        expect(splitMessageIntoMentionSegments(message)).toEqual([{ type: 'text', text: message }]);
    });

    it('is deterministic across repeated calls', () => {
        const message = `hi ${getMentionToken(ALICE)}`;

        expect(splitMessageIntoMentionSegments(message)).toEqual(splitMessageIntoMentionSegments(message));
    });
});

describe('isParticipantMentioned', () => {
    it('detects a direct mention', () => {
        expect(isParticipantMentioned(`hi ${getMentionToken(ALICE)}`, ALICE)).toBe(true);
    });

    it('detects a mention among several ones', () => {
        const message = `${getMentionToken(ROBERT)} and ${getMentionToken(ALICE)}`;

        expect(isParticipantMentioned(message, ALICE)).toBe(true);
    });

    it('treats an everyone mention as a mention of the participant', () => {
        expect(isParticipantMentioned(getMentionToken(EVERYONE_MENTION_ID), ALICE)).toBe(true);
    });

    it('ignores mentions of other participants', () => {
        expect(isParticipantMentioned(`hi ${getMentionToken(ROBERT)}`, ALICE)).toBe(false);
    });

    it('ignores the participant id appearing as plain text', () => {
        expect(isParticipantMentioned(`hi ${ALICE}`, ALICE)).toBe(false);
    });
});
