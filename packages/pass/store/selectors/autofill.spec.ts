import { getStateMock } from '@proton/pass/store/selectors/mock';
import type { FormSubmission } from '@proton/pass/types';
import { parseUrl } from '@proton/pass/utils/url/parser';

import { selectAutofillLoginCandidates, selectOTPCandidate } from './autofill';

const state = getStateMock();

describe('Autofill selectors', () => {
    describe('selectAutofillCandidates', () => {
        test('should return nothing if invalid url', () => {
            expect(selectAutofillLoginCandidates(parseUrl(''))(state)).toEqual([]);
            expect(selectAutofillLoginCandidates({ ...parseUrl('https://a.b.c'), protocol: null })(state)).toEqual([]);
        });

        test('should not pass a protocol filter if url is secure', () => {
            const candidates = selectAutofillLoginCandidates(parseUrl('https://google.com'))(state);
            expect(candidates.length).toEqual(3);
            expect(candidates[0]).toEqual(state.items.byShareId.share3.item6);
            expect(candidates[1]).toEqual(state.items.byShareId.share3.item4);
            expect(candidates[2]).toEqual(state.items.byShareId.share3.item5);
        });

        test('should pass a protocol filter if url is not secure `https:`', () => {
            const candidates = selectAutofillLoginCandidates(parseUrl('http://google.com'))(state);
            expect(candidates.length).toEqual(1);
            expect(candidates[0]).toEqual(state.items.byShareId.share3.item6);
        });

        test('should pass a protocol filter if url is not secure `https:`', () => {
            const candidates = selectAutofillLoginCandidates(parseUrl('http://google.com'))(state);
            expect(candidates.length).toEqual(1);
            expect(candidates[0]).toEqual(state.items.byShareId.share3.item6);
        });

        test('should return only matching protocols', () => {
            const candidates = selectAutofillLoginCandidates(parseUrl('ftp://proton.me'))(state);
            expect(candidates.length).toEqual(1);
            expect(candidates[0]).toEqual(state.items.byShareId.share3.item1);
        });

        test('if no direct public subdomain match, should sort top-level domains and other subdomain matches', () => {
            const candidates = selectAutofillLoginCandidates(parseUrl('https://account.google.com'))(state);
            expect(candidates.length).toEqual(3);
            expect(candidates[0]).toEqual(state.items.byShareId.share3.item6);
            expect(candidates[1]).toEqual(state.items.byShareId.share3.item4);
            expect(candidates[2]).toEqual(state.items.byShareId.share3.item5);
        });

        test('if public subdomain match, should push subdomain matches on top, then top-level domain, then other subdomains', () => {
            const candidates = selectAutofillLoginCandidates(parseUrl('https://my.sub.domain.google.com'))(state);
            expect(candidates.length).toEqual(3);
            expect(candidates[0]).toEqual(state.items.byShareId.share3.item5);
            expect(candidates[1]).toEqual(state.items.byShareId.share3.item6);
            expect(candidates[2]).toEqual(state.items.byShareId.share3.item4);
        });

        test('if private top level domain, should match only top level domain', () => {
            const candidates = selectAutofillLoginCandidates(parseUrl('https://github.io'))(state);
            expect(candidates.length).toEqual(1);
            expect(candidates[0]).toEqual(state.items.byShareId.share1.item3);
        });

        test('if private sub domain, should match only specific subdomain', () => {
            const candidates = selectAutofillLoginCandidates(parseUrl('https://subdomain.github.io'))(state);
            expect(candidates.length).toEqual(1);
            expect(candidates[0]).toEqual(state.items.byShareId.share1.item4);
        });

        test('should not suggest an item from a hidden share', () => {
            const candidates = selectAutofillLoginCandidates(parseUrl('https://domain-of-hidden-share.com'))(state);
            expect(candidates.length).toEqual(0);
        });
    });

    describe('selectOTPCandidate', () => {
        test('should match item for domain and username', () => {
            const submission = { data: { userIdentifier: 'test@proton.me' } } as FormSubmission;
            const candidate = selectOTPCandidate({ ...parseUrl('https://proton.me'), submission })(state);
            expect(candidate).toEqual(state.items.byShareId.share1.item1);
        });

        test('should match item for subdomain and username', () => {
            const submission = { data: { userIdentifier: 'test@proton.me' } } as FormSubmission;
            const candidate = selectOTPCandidate({ ...parseUrl('https://subdomain.proton.me'), submission })(state);
            expect(candidate).toEqual(state.items.byShareId.share1.item1);
        });

        test('should match item for domain and username when matching extra totp field', () => {
            const submission = { data: { userIdentifier: 'test@github.io' } } as FormSubmission;
            const candidate = selectOTPCandidate({
                ...parseUrl('https://private.subdomain.github.io'),
                submission,
            })(state);

            expect(candidate).toEqual(state.items.byShareId.share1.item4);
        });

        test('should match last used item for top-level domain if username not provided', () => {
            const candidate = selectOTPCandidate(parseUrl('https://subdomain.com'))(state);
            expect(candidate).toEqual(state.items.byShareId.share5.item5);
        });

        test('should match last used item for subdomain if username not provided', () => {
            const candidate = selectOTPCandidate(parseUrl('https://b.subdomain.com'))(state);
            expect(candidate).toEqual(state.items.byShareId.share5.item3);
        });

        test('should match item for username & top-level domain', () => {
            const submission = { data: { userIdentifier: 'username@subdomain.com' } } as FormSubmission;
            const candidate = selectOTPCandidate({ ...parseUrl('https://subdomain.com'), submission })(state);
            expect(candidate).toEqual(state.items.byShareId.share5.item5);
        });

        test('should allow item for username & top-level domain on subdomain', () => {
            const submission = { data: { userIdentifier: 'username@subdomain.com' } } as FormSubmission;
            const candidate = selectOTPCandidate({ ...parseUrl('https://unknown.subdomain.com'), submission })(state);
            expect(candidate).toEqual(state.items.byShareId.share5.item5);
        });

        test('should prioritise subdomain/username match', () => {
            const submission = { data: { userIdentifier: 'username@subdomain.com' } } as FormSubmission;
            const candidateA = selectOTPCandidate({ ...parseUrl('https://a.subdomain.com'), submission })(state);
            const candidateB = selectOTPCandidate({ ...parseUrl('https://b.subdomain.com'), submission })(state);
            expect(candidateA).toEqual(state.items.byShareId.share5.item1);
            expect(candidateB).toEqual(state.items.byShareId.share5.item3);
        });

        test('should not match subdomain item for top-level url', () => {
            const submission = { data: { userIdentifier: 'username@subdomain.com' } } as FormSubmission;

            const candidateA = selectOTPCandidate({ ...parseUrl('https://domain.com'), submission })(state);
            expect(candidateA).toEqual(undefined);

            const candidateB = selectOTPCandidate(parseUrl('https://domain.com'))(state);
            expect(candidateB).toEqual(undefined);
        });

        test('should not match subdomain item for sub-subdomain url', () => {
            const candidate = selectOTPCandidate(parseUrl('https://a.b.domain.com'))(state);
            expect(candidate).toEqual(undefined);
        });
    });
});
