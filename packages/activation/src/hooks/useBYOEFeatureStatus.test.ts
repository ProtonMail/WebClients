import { renderHook } from '@testing-library/react';

import { useEntitlementChecksForOrgAndUser } from '@proton/account/entitlementCatalog/hooks';
import { useUser } from '@proton/account/user/hooks';
import { PLANS } from '@proton/payments/core/constants';
import {
    type CataloguedPlan,
    buildOrgAndUserEntitlementChecks,
} from '@proton/payments/testing/prodCatalogGrantsForTesting';
import { organizationMember } from '@proton/payments/testing/usersWhoCannotReadSubscriptions';
import { USER_ROLES } from '@proton/shared/lib/constants';
import { UserType } from '@proton/shared/lib/interfaces/User';
import { useFlag } from '@proton/unleash/useFlag';

import useBYOEFeatureStatus from './useBYOEFeatureStatus';

jest.mock('@proton/account/entitlementCatalog/hooks');
jest.mock('@proton/account/user/hooks');
jest.mock('@proton/unleash/useFlag');

const mockUseEntitlementChecks = useEntitlementChecksForOrgAndUser as jest.Mock;
const mockUseUser = useUser as jest.Mock;
const mockUseFlag = useFlag as jest.Mock;

const memberUser = { Role: USER_ROLES.MEMBER_ROLE, Type: UserType.PROTON, Flags: {} };

const mockMemberOf = (subscriptionPlans: CataloguedPlan[], loadingEntitlements = false) => {
    mockUseUser.mockReturnValue([memberUser, false]);
    mockUseEntitlementChecks.mockReturnValue([
        buildOrgAndUserEntitlementChecks({ subscriptionPlans, ...organizationMember }),
        loadingEntitlements,
    ]);
};

describe('useBYOEFeatureStatus', () => {
    beforeEach(() => {
        mockUseFlag.mockReturnValue(true);
    });

    it('gives access to a member of a mail2022 organization', () => {
        mockMemberOf([PLANS.MAIL]);

        const { result } = renderHook(() => useBYOEFeatureStatus());

        expect(result.current).toEqual([true, false]);
    });

    it('denies access to a non-admin member of a bundlepro2024 organization', () => {
        mockMemberOf([PLANS.BUNDLE_PRO_2024]);

        const { result } = renderHook(() => useBYOEFeatureStatus());

        expect(result.current).toEqual([false, false]);
    });

    it('denies access and reports loading while entitlements load', () => {
        mockMemberOf([PLANS.MAIL], true);

        const { result } = renderHook(() => useBYOEFeatureStatus());

        expect(result.current).toEqual([false, true]);
    });
});
