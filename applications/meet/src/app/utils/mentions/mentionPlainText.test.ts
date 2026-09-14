import { describe, expect, it } from 'vitest';

import { getMentionPlainText } from './mentionPlainText';

const ALICE = 'aaaaaaaa-1111-2222-3333-444444444444';
const ROBERT = 'cccccccc-1111-2222-3333-444444444444';

describe('getMentionPlainText', () => {
    const options = {
        participantNameMap: { [ALICE]: 'Alice' },
        everyoneName: 'everyone',
        unknownName: 'unknown',
    };

    it('resolves a token to the participant name', () => {
        expect(getMentionPlainText(`[participant_uuid:${ALICE}] hi`, options)).toBe('@Alice hi');
    });

    it('resolves the everyone token', () => {
        expect(getMentionPlainText('[participant_uuid:everyone] hi', options)).toBe('@everyone hi');
    });

    it('falls back to unknown for a participant that is no longer in the room', () => {
        expect(getMentionPlainText(`[participant_uuid:${ROBERT}] hi`, options)).toBe('@unknown hi');
    });
});
