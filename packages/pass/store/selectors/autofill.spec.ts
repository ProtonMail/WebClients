import type { FormSubmission } from '../../types';
import { selectAutofillLoginCandidates, selectOTPCandidate } from './autofill';
import { getStateMock } from './mock';

const state = getStateMock();

const options = {};

describe('Autofill selectors', () => {
    describe('selectAutofillCandidates', () => {
        test('should return nothing if invalid url', () => {
            expect(selectAutofillLoginCandidates('', options)(state)).toEqual([]);
            expect(selectAutofillLoginCandidates('https://a.b.c', options)(state)).toEqual([]);
        });

        test('should not pass a protocol filter if url is secure', () => {
            const candidates = selectAutofillLoginCandidates('https://google.com', options)(state);
            expect(candidates.length).toEqual(3);
            expect(candidates[0]).toEqual(state.items.byShareId.share3.item6);
            expect(candidates[1]).toEqual(state.items.byShareId.share3.item4);
            expect(candidates[2]).toEqual(state.items.byShareId.share3.item5);
        });

        test('should pass a protocol filter if url is not secure `https:`', () => {
            const candidates = selectAutofillLoginCandidates('http://google.com', options)(state);
            expect(candidates.length).toEqual(0);
        });

        test('should return only matching protocols', () => {
            const candidates = selectAutofillLoginCandidates('ftp://proton.me', options)(state);
            expect(candidates.length).toEqual(1);
            expect(candidates[0]).toEqual(state.items.byShareId.share3.item1);
        });

        test('if no direct public subdomain match, should sort top-level domains and other subdomain matches', () => {
            const candidates = selectAutofillLoginCandidates('https://account.google.com', options)(state);
            expect(candidates.length).toEqual(3);
            expect(candidates[0]).toEqual(state.items.byShareId.share3.item6);
            expect(candidates[1]).toEqual(state.items.byShareId.share3.item4);
            expect(candidates[2]).toEqual(state.items.byShareId.share3.item5);
        });

        test('if public subdomain match, should push subdomain matches on top, then top-level domain, then other subdomains', () => {
            const candidates = selectAutofillLoginCandidates('https://my.sub.domain.google.com', options)(state);
            expect(candidates.length).toEqual(3);
            expect(candidates[0]).toEqual(state.items.byShareId.share3.item5);
            expect(candidates[1]).toEqual(state.items.byShareId.share3.item4);
            expect(candidates[2]).toEqual(state.items.byShareId.share3.item6);
        });

        test('if private top level domain, should match only top level domain', () => {
            const candidates = selectAutofillLoginCandidates('https://github.io', options)(state);
            expect(candidates.length).toEqual(1);
            expect(candidates[0]).toEqual(state.items.byShareId.share1.item3);
        });

        test('if private sub domain, should match only specific subdomain', () => {
            const candidates = selectAutofillLoginCandidates('https://subdomain.github.io', options)(state);
            expect(candidates.length).toEqual(1);
            expect(candidates[0]).toEqual(state.items.byShareId.share1.item4);
        });

        test('should not suggest an item from a hidden share', () => {
            const candidates = selectAutofillLoginCandidates('https://domain-of-hidden-share.com', options)(state);
            expect(candidates.length).toEqual(0);
        });

        describe('strict option', () => {
            /* https://sub.domain.google.com */
            const item4 = state.items.byShareId.share3.item4;
            /* https://my.sub.domain.google.com */
            const item5 = state.items.byShareId.share3.item5;

            test('should not return sibling-subdomain items in strict mode', () => {
                const candidates = selectAutofillLoginCandidates('https://account.google.com', {
                    strict: true,
                })(state);
                expect(candidates).not.toContain(item4);
                expect(candidates).not.toContain(item5);
            });

            test('should return sibling-subdomain items without strict option', () => {
                const candidates = selectAutofillLoginCandidates('https://account.google.com', {})(state);
                expect(candidates).toContain(item4);
                expect(candidates).toContain(item5);
            });

            test('should return the exact host item in strict mode', () => {
                const candidates = selectAutofillLoginCandidates('https://sub.domain.google.com', {
                    strict: true,
                })(state);
                expect(candidates).toContain(item4);
            });
        });
    });

    describe('selectOTPCandidate', () => {
        test('should match item for domain and username', () => {
            const submission = { data: { userIdentifier: 'test@proton.me' } } as FormSubmission;
            const candidate = selectOTPCandidate('https://proton.me', submission)(state);
            expect(candidate).toEqual(state.items.byShareId.share1.item1);
        });

        test('should match item for subdomain and username', () => {
            const submission = { data: { userIdentifier: 'test@proton.me' } } as FormSubmission;
            const candidate = selectOTPCandidate('https://subdomain.proton.me', submission)(state);
            expect(candidate).toEqual(state.items.byShareId.share1.item1);
        });

        test('should match item for domain and username when matching extra totp field', () => {
            const submission = { data: { userIdentifier: 'test@github.io' } } as FormSubmission;
            const candidate = selectOTPCandidate('https://private.subdomain.github.io', submission)(state);
            expect(candidate).toEqual(state.items.byShareId.share1.item4);
        });

        test('should match last used item for top-level domain if username not provided', () => {
            const candidate = selectOTPCandidate('https://subdomain.com')(state);
            expect(candidate).toEqual(state.items.byShareId.share5.item5);
        });

        test('should match last used item for subdomain if username not provided', () => {
            const candidate = selectOTPCandidate('https://b.subdomain.com')(state);
            expect(candidate).toEqual(state.items.byShareId.share5.item3);
        });

        test('should match item for username & top-level domain', () => {
            const submission = { data: { userIdentifier: 'username@subdomain.com' } } as FormSubmission;
            const candidate = selectOTPCandidate('https://subdomain.com', submission)(state);
            expect(candidate).toEqual(state.items.byShareId.share5.item5);
        });

        test('should allow item for username & top-level domain on subdomain', () => {
            const submission = { data: { userIdentifier: 'username@subdomain.com' } } as FormSubmission;
            const candidate = selectOTPCandidate('https://unknown.subdomain.com', submission)(state);
            expect(candidate).toEqual(state.items.byShareId.share5.item5);
        });

        test('should prioritise subdomain/username match', () => {
            const submission = { data: { userIdentifier: 'username@subdomain.com' } } as FormSubmission;
            const candidateA = selectOTPCandidate('https://a.subdomain.com', submission)(state);
            const candidateB = selectOTPCandidate('https://b.subdomain.com', submission)(state);
            expect(candidateA).toEqual(state.items.byShareId.share5.item1);
            expect(candidateB).toEqual(state.items.byShareId.share5.item3);
        });

        test('should not match subdomain item for top-level url', () => {
            const submission = { data: { userIdentifier: 'username@subdomain.com' } } as FormSubmission;

            const candidateA = selectOTPCandidate('https://domain.com', submission)(state);
            expect(candidateA).toEqual(undefined);

            const candidateB = selectOTPCandidate('https://domain.com')(state);
            expect(candidateB).toEqual(undefined);
        });

        test('should not match subdomain item for sub-subdomain url', () => {
            const candidate = selectOTPCandidate('https://a.b.domain.com')(state);
            expect(candidate).toEqual(undefined);
        });
    });
});
