import { describe, expect, it } from 'vitest';

import { CYCLE, PLANS } from '@proton/payments/core/constants';

import type { Model } from './SubscriptionContainer';
import { getInitialCheckRefusal } from './initialCheckRefusal';

const refusal = {
    status: 422,
    data: { Code: 2000, Error: 'Unable to combine the new plan with the existing subscriptions.' },
};

const openingSelection = { planIDs: { [PLANS.MAIL]: 1 }, cycle: CYCLE.MONTHLY };
const firstCheck = { initialCheckComplete: false } as Model;

describe('getInitialCheckRefusal', () => {
    it('returns the backend message when the selection the modal opened with is refused', () => {
        expect(
            getInitialCheckRefusal({
                model: firstCheck,
                checkedSelection: { planIDs: { [PLANS.MAIL]: 1 }, cycle: CYCLE.MONTHLY },
                openingSelection,
                error: refusal,
            })
        ).toBe('Unable to combine the new plan with the existing subscriptions.');
    });

    it('ignores a refused check after a successful one, which keeps the modal on its current step', () => {
        expect(
            getInitialCheckRefusal({
                model: { initialCheckComplete: true } as Model,
                checkedSelection: openingSelection,
                openingSelection,
                error: refusal,
            })
        ).toBeUndefined();
    });

    it.each([
        ['another plan', { planIDs: { [PLANS.BUNDLE]: 1 }, cycle: CYCLE.MONTHLY }],
        ['another cycle', { planIDs: { [PLANS.MAIL]: 1 }, cycle: CYCLE.YEARLY }],
    ])('ignores a refused %s chosen before any check succeeded', (_, checkedSelection) => {
        expect(
            getInitialCheckRefusal({ model: firstCheck, checkedSelection, openingSelection, error: refusal })
        ).toBeUndefined();
    });

    it.each([
        ['a server error', { status: 500, data: { Code: 2000, Error: 'Internal error' } }],
        ['a rate limit', { status: 429, data: { Code: 2028, Error: 'Too many requests' } }],
        ['an expired session', { status: 401, data: { Code: 10013, Error: 'Session timed out' } }],
        ['a missing permission', { status: 403, data: { Code: 2011, Error: 'Not allowed' } }],
        ['an invalid request', { status: 400, data: { Code: 2000, Error: 'Invalid input' } }],
        ['a client error', new TypeError('Cannot read properties of undefined')],
        ['an offline user', Object.assign(new Error('Offline'), { name: 'OfflineError' })],
    ])('ignores a first check that failed because of %s', (_, error) => {
        expect(
            getInitialCheckRefusal({ model: firstCheck, checkedSelection: openingSelection, openingSelection, error })
        ).toBeUndefined();
    });
});
