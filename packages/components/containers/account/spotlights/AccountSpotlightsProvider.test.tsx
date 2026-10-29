import { render, screen } from '@testing-library/react';

import { useEntitlementChecksForOrgAndUser } from '@proton/account/entitlementCatalog/hooks';
import { useOrganization } from '@proton/account/organization/hooks';
import { useUser } from '@proton/account/user/hooks';
import useFeature from '@proton/features/useFeature';
import { PLANS } from '@proton/payments/core/constants';
import {
    type CataloguedPlan,
    buildOrgAndUserEntitlementChecks,
} from '@proton/payments/testing/prodCatalogGrantsForTesting';
import { regularAdmin } from '@proton/payments/testing/regularAdmin';
import { mspSubsidiaryAdmin, organizationMember } from '@proton/payments/testing/usersWhoCannotReadSubscriptions';
import type { OrganizationExtended } from '@proton/shared/lib/interfaces/Organization';
import type { UserModel } from '@proton/shared/lib/interfaces/User';

import { AccountSpotlightsProvider, useAccountSpotlights } from './AccountSpotlightsProvider';

jest.mock('@proton/account/entitlementCatalog/hooks', () => ({
    useEntitlementChecksForOrgAndUser: jest.fn(),
}));

jest.mock('@proton/account/organization/hooks', () => ({
    useOrganization: jest.fn(),
}));

jest.mock('@proton/account/user/hooks', () => ({
    useUser: jest.fn(),
}));

jest.mock('@proton/features/useFeature', () => ({
    __esModule: true,
    default: jest.fn(),
}));

const SpotlightState = () => {
    const {
        passOnboardingSpotlights: { setupOrgSpotlight, startUsingPassSpotlight },
    } = useAccountSpotlights();

    return (
        <>
            <div data-testid="setup-org">{String(setupOrgSpotlight.isOpen)}</div>
            <div data-testid="start-using-pass">{String(startUsingPassSpotlight.isOpen)}</div>
        </>
    );
};

const renderProvider = ({
    subscriptionPlans,
    step,
    viewer = regularAdmin,
}: {
    subscriptionPlans: CataloguedPlan[];
    step: 'SetupOrg' | 'UsePass' | 'Done';
    viewer?: typeof regularAdmin;
}) => {
    jest.mocked(useUser).mockReturnValue([viewer.user as UserModel, false]);
    jest.mocked(useOrganization).mockReturnValue([viewer.organization as OrganizationExtended, false]);
    jest.mocked(useEntitlementChecksForOrgAndUser).mockReturnValue([
        buildOrgAndUserEntitlementChecks({ subscriptionPlans, ...viewer }),
        false,
    ]);
    jest.mocked(useFeature).mockReturnValue({
        feature: { Value: step },
        update: jest.fn(),
        loading: false,
    } as unknown as ReturnType<typeof useFeature>);

    render(
        <AccountSpotlightsProvider>
            <SpotlightState />
        </AccountSpotlightsProvider>
    );
};

describe('AccountSpotlightsProvider', () => {
    it.each([PLANS.PASS_PRO, PLANS.PASS_BUSINESS, PLANS.VPN_PASS_BUNDLE_BUSINESS] as const)(
        'opens the setup organization spotlight for an admin of %s',
        (plan) => {
            renderProvider({ subscriptionPlans: [plan], step: 'SetupOrg' });

            expect(screen.getByTestId('setup-org')).toHaveTextContent('true');
            expect(screen.getByTestId('start-using-pass')).toHaveTextContent('false');
        }
    );

    it('opens the start using Pass spotlight on the second step', () => {
        renderProvider({ subscriptionPlans: [PLANS.PASS_BUSINESS], step: 'UsePass' });

        expect(screen.getByTestId('setup-org')).toHaveTextContent('false');
        expect(screen.getByTestId('start-using-pass')).toHaveTextContent('true');
    });

    it.each([PLANS.BUNDLE_PRO_2024, PLANS.BUNDLE_BIZ_2025, PLANS.VPN_BUSINESS, PLANS.PASS] as const)(
        'keeps the spotlights closed for an admin of %s',
        (plan) => {
            renderProvider({ subscriptionPlans: [plan], step: 'SetupOrg' });

            expect(screen.getByTestId('setup-org')).toHaveTextContent('false');
        }
    );

    it('opens the spotlight when Pass Business sits next to Mail Plus', () => {
        renderProvider({ subscriptionPlans: [PLANS.MAIL, PLANS.PASS_BUSINESS], step: 'SetupOrg' });

        expect(screen.getByTestId('setup-org')).toHaveTextContent('true');
    });

    it.each([
        { case: 'a member', viewer: organizationMember },
        { case: 'an admin of an MSP subsidiary', viewer: mspSubsidiaryAdmin },
    ])('keeps the spotlights closed for $case of a Pass Business organization', ({ viewer }) => {
        renderProvider({ subscriptionPlans: [PLANS.PASS_BUSINESS], step: 'UsePass', viewer });

        expect(screen.getByTestId('start-using-pass')).toHaveTextContent('false');
    });
});
