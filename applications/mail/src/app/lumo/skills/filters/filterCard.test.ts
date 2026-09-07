import { hasEveryFilterFieldFilled } from './filterCard';

const SIEVE = 'require ["fileinto"];\nfileinto "Travel";';

describe('hasEveryFilterFieldFilled', () => {
    // An emptied field would send a nameless or scriptless filter, which the backend rejects — the model
    // would learn about it only as a failure, after the user confirmed.
    it.each([
        ['an emptied name', { name: '  ', sieve: SIEVE }, false],
        ['a missing name', { sieve: SIEVE }, false],
        ['an emptied script', { name: 'Travel', sieve: '' }, false],
        ['a missing script', { name: 'Travel' }, false],
        ['both fields filled in', { name: 'Travel', sieve: SIEVE }, true],
    ])('blocks Confirm on %s', (_case, params, applyable) => {
        expect(hasEveryFilterFieldFilled(params)).toBe(applyable);
    });
});
