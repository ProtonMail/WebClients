import { describe, expect, it } from 'vitest';

import { getMessagePlainText } from './messagePlainText';

const ALICE = 'aaaaaaaa-1111-2222-3333-444444444444';
const ROBERT = 'cccccccc-1111-2222-3333-444444444444';

describe('getMessagePlainText', () => {
    const options = {
        participantNameMap: { [ALICE]: 'Alice' },
        everyoneName: 'everyone',
        unknownName: 'unknown',
    };

    it('resolves a token to the participant name', () => {
        expect(getMessagePlainText(`[participant_uuid:${ALICE}] hi`, options)).toBe('@Alice hi');
    });

    it('resolves the everyone token', () => {
        expect(getMessagePlainText('[participant_uuid:everyone] hi', options)).toBe('@everyone hi');
    });

    it('falls back to unknown for a participant that is no longer in the room', () => {
        expect(getMessagePlainText(`[participant_uuid:${ROBERT}] hi`, options)).toBe('@unknown hi');
    });

    it('resolves a Lumo emoji token to its name', () => {
        expect(getMessagePlainText('[lumo_emoji:this-is-fine] again', options)).toBe('This is fine again');
    });

    it('adds a space only where a Lumo emoji name would touch a letter or digit', () => {
        expect(getMessagePlainText('great[lumo_emoji:chefs-kiss]!', options)).toBe("great Chef's kiss!");
        expect(getMessagePlainText('[lumo_emoji:cash][lumo_emoji:rocket]2', options)).toBe('Cash Rocket 2');
        expect(getMessagePlainText('([lumo_emoji:rocket])', options)).toBe('(Rocket)');
    });

    it('resolves a mention and a Lumo emoji in the same message', () => {
        expect(getMessagePlainText(`[participant_uuid:${ALICE}] [lumo_emoji:this-is-fine]`, options)).toBe(
            '@Alice This is fine'
        );
        expect(getMessagePlainText(`[participant_uuid:${ALICE}][lumo_emoji:rocket]`, options)).toBe('@Alice Rocket');
    });

    it('leaves a Lumo emoji token with an unknown id as written', () => {
        expect(getMessagePlainText('[lumo_emoji:unicorn] hi', options)).toBe('[lumo_emoji:unicorn] hi');
    });

    it('keeps a participant name that contains a Lumo emoji token as typed', () => {
        const nameWithToken = { ...options, participantNameMap: { [ALICE]: 'Alice [lumo_emoji:rocket]' } };

        expect(getMessagePlainText(`[participant_uuid:${ALICE}] hi`, nameWithToken)).toBe(
            '@Alice [lumo_emoji:rocket] hi'
        );
    });
});
