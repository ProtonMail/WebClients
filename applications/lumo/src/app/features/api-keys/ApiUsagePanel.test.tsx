import { render } from '@testing-library/react';

import { useMember } from '@proton/account/member/hook';
import { usePaymentMethods } from '@proton/account/paymentMethods/hooks';
import { useUser } from '@proton/account/user/hooks';
import { Autopay, PAYMENT_METHOD_TYPES } from '@proton/payments/core/constants';
import { MEMBER_SUBSCRIBER, USER_ROLES } from '@proton/shared/lib/constants';
import type { User } from '@proton/shared/lib/interfaces/User';
import { formatUser } from '@proton/shared/lib/user/helpers';
import { useFlag } from '@proton/unleash/useFlag';

import { useLumoPlan } from '../../hooks/useLumoPlan';
import { ApiUsageDashboard } from './ApiUsageDashboard';
import { ApiUsagePanel } from './ApiUsagePanel';
import { useCanBuyLumoCredits } from './useCanBuyLumoCredits';

jest.mock('@proton/account/member/hook');
jest.mock('@proton/account/paymentMethods/hooks');
jest.mock('@proton/account/user/hooks');
jest.mock('../../hooks/useLumoPlan');
jest.mock('@proton/unleash/useFlag');
jest.mock('./ApiUsageDashboard', () => ({ ApiUsageDashboard: jest.fn(() => null) }));
jest.mock('./useCanBuyLumoCredits');

const card = { Type: PAYMENT_METHOD_TYPES.CHARGEBEE_CARD, Autopay: Autopay.ENABLE, IsDefault: true };

const renderedProps = ({
    Role = USER_ROLES.ADMIN_ROLE,
    member = { Subscriber: MEMBER_SUBSCRIBER.PAYER },
    paymentMethods = [card],
    autoTopUpFlag = true,
    canBuyLumoCredits = true,
}: {
    Role?: USER_ROLES;
    member?: { Subscriber?: MEMBER_SUBSCRIBER };
    paymentMethods?: object[];
    autoTopUpFlag?: boolean;
    canBuyLumoCredits?: boolean;
} = {}) => {
    (useCanBuyLumoCredits as jest.Mock).mockReturnValue(canBuyLumoCredits);
    (useFlag as jest.Mock).mockImplementation(
        (name: string) => name === 'LumoAllowAutomaticCreditTopUps' && autoTopUpFlag
    );
    (useLumoPlan as jest.Mock).mockReturnValue({ isOrgAdmin: false, userIsMember: false });
    (useUser as jest.Mock).mockReturnValue([formatUser({ Role } as User)]);
    (useMember as jest.Mock).mockReturnValue([member]);
    (usePaymentMethods as jest.Mock).mockReturnValue([paymentMethods]);
    render(<ApiUsagePanel />);
    return (ApiUsageDashboard as unknown as jest.Mock).mock.calls.at(-1)[0];
};

describe('ApiUsagePanel', () => {
    it('lets the primary administrator manage the balance', () => {
        expect(renderedProps()).toMatchObject({ canManageBalance: true, canChargeAutoTopUp: true });
    });

    it.each([true, false])('shows the automatic top-up when its flag is %p', (autoTopUpFlag) => {
        expect(renderedProps({ autoTopUpFlag }).showAutoTopUp).toBe(autoTopUpFlag);
    });

    it('lets a user without an organization manage the balance', () => {
        expect(renderedProps({ Role: USER_ROLES.FREE_ROLE, member: {} }).canManageBalance).toBe(true);
    });

    it.each([true, false])('lets the dashboard top up when the Lumo credits buyer check is %p', (canBuyLumoCredits) => {
        expect(renderedProps({ canBuyLumoCredits }).canTopUp).toBe(canBuyLumoCredits);
    });

    it('does not let a non-paying member manage the balance', () => {
        const member = { Subscriber: MEMBER_SUBSCRIBER.NON_PAYER };

        expect(renderedProps({ Role: USER_ROLES.MEMBER_ROLE, member }).canManageBalance).toBe(false);
    });

    it('does not let a secondary administrator manage the balance', () => {
        const member = { Subscriber: MEMBER_SUBSCRIBER.NON_PAYER };

        expect(renderedProps({ Role: USER_ROLES.ADMIN_ROLE, member }).canManageBalance).toBe(false);
    });

    it('does not let a user who cannot pay manage the balance', () => {
        expect(renderedProps({ Role: USER_ROLES.MEMBER_ROLE }).canManageBalance).toBe(false);
    });

    it.each([
        ['no saved payment method', []],
        ['automatic payments turned off', [{ ...card, Autopay: Autopay.DISABLE }]],
        ['a default SEPA mandate', [{ ...card, Type: PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT }]],
        ['a default iDEAL mandate', [{ ...card, Type: PAYMENT_METHOD_TYPES.CHARGEBEE_IDEAL }]],
        [
            'automatic payments off on the default card but on for another card',
            [
                { ...card, Autopay: Autopay.DISABLE },
                { ...card, IsDefault: false },
            ],
        ],
    ])('cannot charge an automatic top-up with %s', (_, paymentMethods) => {
        expect(renderedProps({ paymentMethods }).canChargeAutoTopUp).toBe(false);
    });

    it('charges an automatic top-up from a default PayPal account', () => {
        const paypal = { Type: PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL, IsDefault: true };

        expect(renderedProps({ paymentMethods: [paypal] }).canChargeAutoTopUp).toBe(true);
    });

    it('charges an automatic top-up from a default card next to a saved SEPA mandate', () => {
        const sepa = { ...card, Type: PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT, IsDefault: false };

        expect(renderedProps({ paymentMethods: [card, sepa] }).canChargeAutoTopUp).toBe(true);
    });
});
