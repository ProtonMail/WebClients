import type { ReactNode } from 'react';

import { render, screen, waitFor } from '@testing-library/react';

import { useAddresses } from '@proton/account/addresses/hooks';
import { useEntitlementChecksForOrgAndUser } from '@proton/account/entitlementCatalog/hooks';
import { useApi } from '@proton/app-context/useApi';
import { PLANS } from '@proton/payments/core/constants';
import {
    type CataloguedPlan,
    buildOrgAndUserEntitlementChecks,
} from '@proton/payments/testing/prodCatalogGrantsForTesting';
import { organizationMember } from '@proton/payments/testing/usersWhoCannotReadSubscriptions';

import SMTPSubmissionSection from './SMTPSubmissionSection';

jest.mock('@proton/account/entitlementCatalog/hooks', () => ({
    useEntitlementChecksForOrgAndUser: jest.fn(),
}));
jest.mock('@proton/account/addresses/hooks', () => ({ useAddresses: jest.fn() }));
jest.mock('@proton/app-context/useApi', () => ({ useApi: jest.fn() }));
jest.mock('@proton/app-context/useNotifications', () => ({
    useNotifications: () => ({ createNotification: jest.fn() }),
}));
jest.mock('../../hooks/useActiveBreakpoint', () => () => ({ viewportWidth: { '>=large': true } }));
jest.mock('../account/UpgradeBanner', () => ({ children }: { children: ReactNode }) => <div>{children}</div>);

const upsellText = 'Included with Mail Plus, Proton Unlimited, and Proton for Business.';

const renderSection = ({
    subscriptionPlans,
    loadingEntitlements = false,
    viewer = {},
}: {
    subscriptionPlans: CataloguedPlan[];
    loadingEntitlements?: boolean;
    viewer?: Partial<typeof organizationMember>;
}) => {
    const api = jest.fn().mockResolvedValue({ SmtpTokens: [] });
    jest.mocked(useApi).mockReturnValue(api);
    jest.mocked(useAddresses).mockReturnValue([[], false]);
    jest.mocked(useEntitlementChecksForOrgAndUser).mockReturnValue([
        buildOrgAndUserEntitlementChecks({ subscriptionPlans, ...viewer }),
        loadingEntitlements,
    ]);
    render(<SMTPSubmissionSection />);
    return { api };
};

describe('SMTPSubmissionSection', () => {
    it.each([PLANS.MAIL, PLANS.BUNDLE, PLANS.MAIL_PRO, PLANS.BUNDLE_BIZ_2025] as const)(
        'offers token generation and loads the tokens for %s',
        async (plan) => {
            const { api } = renderSection({ subscriptionPlans: [plan] });

            expect(screen.getByRole('button', { name: 'Generate token' })).toBeInTheDocument();
            expect(screen.queryByText(upsellText)).not.toBeInTheDocument();
            await waitFor(() =>
                expect(api).toHaveBeenCalledWith(expect.objectContaining({ url: 'mail/v4/smtptokens' }))
            );
        }
    );

    it('offers token generation when Mail Plus sits next to VPN Plus', () => {
        renderSection({ subscriptionPlans: [PLANS.VPN2024, PLANS.MAIL] });

        expect(screen.getByRole('button', { name: 'Generate token' })).toBeInTheDocument();
        expect(screen.queryByText(upsellText)).not.toBeInTheDocument();
    });

    it('offers token generation to a member of a business organization', () => {
        renderSection({ subscriptionPlans: [PLANS.BUNDLE_PRO_2024], viewer: organizationMember });

        expect(screen.getByRole('button', { name: 'Generate token' })).toBeInTheDocument();
    });

    it.each([PLANS.VPN2024, PLANS.DRIVE_PRO, PLANS.PASS, PLANS.MEET_BUSINESS] as const)(
        'shows the upsell without loading tokens for %s',
        (plan) => {
            const { api } = renderSection({ subscriptionPlans: [plan] });

            expect(screen.getByText(upsellText)).toBeInTheDocument();
            expect(screen.queryByRole('button', { name: 'Generate token' })).not.toBeInTheDocument();
            expect(api).not.toHaveBeenCalled();
        }
    );

    it('shows neither the upsell nor the tokens while entitlements load', () => {
        const { api } = renderSection({ subscriptionPlans: [PLANS.MAIL], loadingEntitlements: true });

        expect(screen.queryByText(upsellText)).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Generate token' })).not.toBeInTheDocument();
        expect(api).not.toHaveBeenCalled();
    });
});
