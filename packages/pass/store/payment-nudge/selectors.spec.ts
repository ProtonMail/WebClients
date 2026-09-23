import { PLANS } from '@proton/payments/core/constants';
import type { SavedPaymentMethod } from '@proton/payments/core/interface';
import { USER_ROLES } from '@proton/shared/lib/constants';
import type { User } from '@proton/shared/lib/interfaces';

import { type PassPlanResponse, PlanType } from '../../types';
import * as epoch from '../../utils/time/epoch';
import type { RequestState } from '../request/types';
import type { State } from '../types';
import { getPaymentNudgePaymentMethods } from './actions';
import { selectPaymentNudgeEligible } from './selectors';

jest.mock('@proton/pass/utils/time/epoch', () => ({
    ...jest.requireActual('@proton/pass/utils/time/epoch'),
    getEpoch: jest.fn(),
}));

const NOW = 1_000;

const TRIAL_PLAN = {
    Type: PlanType.BUSINESS,
    InternalName: PLANS.PASS_BUSINESS,
    ManageSubscription: true,
    TrialEnd: NOW + 100,
} as PassPlanResponse;

const ADMIN_USER = { Role: USER_ROLES.ADMIN_ROLE, Subscribed: 1 } as User;

type StateOptions = {
    plan?: PassPlanResponse;
    user?: User;
    paymentMethods?: SavedPaymentMethod[];
    pending?: boolean;
};

const mockState = ({ plan = TRIAL_PLAN, user = ADMIN_USER, paymentMethods, pending }: StateOptions): State => {
    const request: RequestState = {};

    if (pending) request[getPaymentNudgePaymentMethods.requestID()] = { status: 'start', progress: 0 };
    else if (paymentMethods) {
        request[getPaymentNudgePaymentMethods.requestID()] = { status: 'success', requestedAt: NOW, data: paymentMethods };
    }

    return { user: { plan, user }, request } as State;
};

describe('`selectPaymentNudgeEligible`', () => {
    beforeEach(() => jest.mocked(epoch.getEpoch).mockReturnValue(NOW));

    test('resolves `true` for a B2B trial without a payment method', () => {
        expect(selectPaymentNudgeEligible(mockState({ paymentMethods: [] }))).toBe(true);
    });

    test('resolves `false` once a payment method is on file', () => {
        const state = mockState({ paymentMethods: [{ ID: 'method-1' } as SavedPaymentMethod] });
        expect(selectPaymentNudgeEligible(state)).toBe(false);
    });

    test('resolves `false` while the lookup is unresolved', () => {
        expect(selectPaymentNudgeEligible(mockState({ pending: true }))).toBe(false);
        expect(selectPaymentNudgeEligible(mockState({}))).toBe(false);
    });

    test('resolves `false` when the local pre-gate rejects, despite a resolved lookup', () => {
        const plan = { ...TRIAL_PLAN, ManageSubscription: false };
        expect(selectPaymentNudgeEligible(mockState({ plan, paymentMethods: [] }))).toBe(false);
    });

    test('resolves `false` for a B2C trial with a resolved lookup', () => {
        const plan = { ...TRIAL_PLAN, Type: PlanType.PLUS, InternalName: PLANS.PASS } as PassPlanResponse;
        expect(selectPaymentNudgeEligible(mockState({ plan, paymentMethods: [] }))).toBe(false);
    });
});
