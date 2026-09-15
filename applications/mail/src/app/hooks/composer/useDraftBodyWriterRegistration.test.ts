import { MESSAGE_ACTIONS } from '@proton/mail-renderer/constants';

import { CLASSNAME_SIGNATURE_CONTAINER } from '../../helpers/message/messageSignature';
import { canPreserveQuote } from './useDraftBodyWriterRegistration';

const SIGNED_HTML = `<div>Tuesday works.</div><div class="${CLASSNAME_SIGNATURE_CONTAINER}"><div>Alice</div></div><blockquote class="protonmail_quote">The original</blockquote>`;
const FOREIGN_HTML = '<div>Tuesday works.</div><blockquote class="protonmail_quote">The original</blockquote>';

describe('canPreserveQuote', () => {
    describe('a plain text draft, cut at the signature text', () => {
        it('is true for a reply whose signature carries text to find it by', () => {
            const content = 'Tuesday works.\n\nAlice\n\n> The original';
            expect(canPreserveQuote(true, '\n\nAlice', MESSAGE_ACTIONS.REPLY, content)).toBe(true);
        });

        it('is false for a reply whose signature was deleted from the editor', () => {
            expect(canPreserveQuote(true, '\n\nAlice', MESSAGE_ACTIONS.REPLY, 'Tuesday works.')).toBe(false);
        });

        it.each([[''], ['\n\n'], ['   ']])(
            'is false for a reply whose signature is %j, which locates nothing',
            (signature) => {
                expect(canPreserveQuote(true, signature, MESSAGE_ACTIONS.REPLY, '')).toBe(false);
            }
        );

        it('is true for a new message, which has no quote to lose', () => {
            expect(canPreserveQuote(true, '', MESSAGE_ACTIONS.NEW, '')).toBe(true);
        });

        it('is false for a draft of unknown provenance with no signature', () => {
            expect(canPreserveQuote(true, '', undefined, '')).toBe(false);
        });
    });

    /**
     * The HTML write deletes every top-level child up to the signature element, so without one it deletes
     * the quote too — the same failure the plain text branch refuses, in a draft composed outside Proton.
     */
    describe('an HTML draft, cut at the signature element', () => {
        it('is true for a reply carrying the signature element', () => {
            expect(canPreserveQuote(false, '', MESSAGE_ACTIONS.REPLY, SIGNED_HTML)).toBe(true);
        });

        it('is false for a reply with no signature element to stop the delete at', () => {
            expect(canPreserveQuote(false, '', MESSAGE_ACTIONS.REPLY, FOREIGN_HTML)).toBe(false);
        });

        it('is false for a reopened draft of unknown provenance', () => {
            expect(canPreserveQuote(false, '', undefined, FOREIGN_HTML)).toBe(false);
        });

        it('is true for a new message, which has no quote to lose', () => {
            expect(canPreserveQuote(false, '', MESSAGE_ACTIONS.NEW, '')).toBe(true);
        });
    });
});
