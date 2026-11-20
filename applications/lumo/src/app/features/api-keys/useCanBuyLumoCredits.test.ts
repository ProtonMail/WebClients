import { renderHook } from '@testing-library/react';
import type { Mock } from 'vitest';

import { useEntitlementChecksForOrgAndUser } from '@proton/account/entitlementCatalog/hooks';
import { useMember } from '@proton/account/member/hook';
import { MEMBER_SUBSCRIBER } from '@proton/shared/lib/constants';

import { useLumoFlags } from '../../hooks/useLumoFlags';
import { useCanBuyLumoCredits } from './useCanBuyLumoCredits';

vi.mock('@proton/account/entitlementCatalog/hooks');
vi.mock('@proton/account/member/hook');
vi.mock('../../hooks/useLumoFlags');

const setup = ({
    allowPurchasingCredits = true,
    subscriber,
    hasLumoCredits = true,
}: {
    allowPurchasingCredits?: boolean;
    subscriber?: MEMBER_SUBSCRIBER;
    hasLumoCredits?: boolean;
}) => {
    (useLumoFlags as Mock).mockReturnValue({ allowPurchasingCredits });
    (useMember as Mock).mockReturnValue([subscriber === undefined ? undefined : { Subscriber: subscriber }]);
    (useEntitlementChecksForOrgAndUser as Mock).mockReturnValue([{ hasLumoCredits }, false]);
    return renderHook(() => useCanBuyLumoCredits()).result.current;
};

describe('useCanBuyLumoCredits', () => {
    it('allows the primary admin when the flag is on', () => {
        expect(setup({ subscriber: MEMBER_SUBSCRIBER.PAYER })).toBe(true);
    });

    it('refuses the primary admin when the flag is off', () => {
        expect(setup({ allowPurchasingCredits: false, subscriber: MEMBER_SUBSCRIBER.PAYER })).toBe(false);
    });

    it('refuses the primary admin when the plan does not include Lumo credits', () => {
        expect(setup({ subscriber: MEMBER_SUBSCRIBER.PAYER, hasLumoCredits: false })).toBe(false);
    });

    it('refuses a secondary admin or member', () => {
        expect(setup({ subscriber: MEMBER_SUBSCRIBER.NON_PAYER })).toBe(false);
    });

    it('refuses while the member is not loaded', () => {
        expect(setup({})).toBe(false);
    });
});
