import { MIME_TYPES } from '@proton/shared/lib/constants';

import type { OneTimeCodeInput } from './OneTimeCodeDetector';
import OneTimeCodeDetector from './OneTimeCodeDetector';

const extract = (input: Partial<OneTimeCodeInput>): string | null =>
    OneTimeCodeDetector.extract({
        subject: '',
        body: '',
        mimeType: MIME_TYPES.DEFAULT,
        timestamp: 0,
        ...input,
    }).code;

describe('OneTimeCodeDetector', () => {
    it('detects a code at the end of the subject', () => {
        expect(extract({ subject: 'Your code is 123456' })).toBe('123456');
    });

    it('detects a code in the visible HTML body', () => {
        const body = '<html><body><p>Your verification code is 845213</p></body></html>';
        expect(extract({ subject: 'Sign in', body, mimeType: MIME_TYPES.DEFAULT })).toBe('845213');
    });

    it('detects a hyphenated-alpha code (e.g. AAA-BBB) and joins it', () => {
        const body = '<html><body><div>ABC-DEF</div></body></html>';
        expect(extract({ subject: 'Slack confirmation', body, mimeType: MIME_TYPES.DEFAULT })).toBe('ABCDEF');
    });

    it('detects an edge-anchored hyphenated code with digits in the subject (e.g. QEM-77W)', () => {
        // title_hyphenated_alpha_code (letters only) misses this; the edge-anchored
        // title_ends_hyphenated_code recovers it.
        expect(extract({ subject: 'Slack confirmation code: QEM-77W' })).toBe('QEM77W');
    });

    it('detects a code introduced by colon phrasing in plaintext', () => {
        expect(extract({ subject: 'Notification', body: 'Your code: 998877', mimeType: MIME_TYPES.PLAINTEXT })).toBe(
            '998877'
        );
    });

    it('rejects a candidate that matches the email send date', () => {
        // 2026-05-29 UTC — the subject digits are exactly the send date, so the
        // date blacklist removes the only candidate and nothing wins.
        const timestamp = Date.UTC(2026, 4, 29) / 1000;
        expect(extract({ subject: 'Code 20260529', timestamp })).toBeNull();
    });

    it('returns null when there is no unique winner', () => {
        expect(extract({ subject: '123456 654321' })).toBeNull();
    });

    describe('real-world end-to-end (sanitized)', () => {
        it('combines subject and body votes to pick the code', () => {
            // Subject (title_mid) and body (visible/edge/joined) all back 937326.
            const body = '<html><body><p>937326 is your verification code</p></body></html>';
            expect(extract({ subject: '937326 is your verification code', body })).toBe('937326');
        });

        it('recovers a code split across sibling spans in the body', () => {
            const body = '<html><body><p>Your code is <span>021</span><span>667</span></p></body></html>';
            expect(extract({ subject: 'Code de vérification', body })).toBe('021667');
        });

        it('reads a code from an element attribute when the visible text is split', () => {
            const body =
                '<html><body><p title="Votre code de vérification est : 330756">' +
                '<span>330</span><span>756</span></p></body></html>';
            expect(extract({ subject: 'Code de vérification', body })).toBe('330756');
        });

        it('detects a 4-digit plaintext code introduced by colon phrasing', () => {
            const body = 'Your login code: 1776\nDo not share it.';
            expect(extract({ subject: 'Login code', body, mimeType: MIME_TYPES.PLAINTEXT })).toBe('1776');
        });

        it('drops a body candidate that matches the send date, leaving the real code to win', () => {
            // 2026-05-29: the date string 20260529 appears in the body but is
            // blacklisted, so the genuine code 845213 wins on the remaining votes.
            const timestamp = Date.UTC(2026, 4, 29) / 1000;
            const body = '<html><body><p>Sent 20260529. Your code is 845213</p></body></html>';
            expect(extract({ subject: 'Verification', body, timestamp })).toBe('845213');
        });
    });

    describe('extractFromTitle', () => {
        const extractFromTitle = (subject: string, timestamp = 0): string | null =>
            OneTimeCodeDetector.extractFromTitle({ subject, timestamp }).code;

        it('detects a code from the subject alone', () => {
            expect(extractFromTitle('Your code is 123456')).toBe('123456');
        });

        it('ignores the body entirely (only the subject is read)', () => {
            // No body is even accepted by the signature, so a subject without a
            // code yields nothing regardless of what a body might contain.
            expect(extractFromTitle('Sign in')).toBeNull();
        });

        it('still applies the send-date blacklist', () => {
            const timestamp = Date.UTC(2026, 4, 29) / 1000;
            expect(extractFromTitle('Code 20260529', timestamp)).toBeNull();
        });

        it('returns null when there is no unique winner', () => {
            expect(extractFromTitle('123456 654321')).toBeNull();
        });
    });
});
