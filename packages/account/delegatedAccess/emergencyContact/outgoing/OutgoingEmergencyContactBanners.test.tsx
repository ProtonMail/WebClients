import { expect } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import { addDays, getUnixTime } from 'date-fns';

import { PLANS } from '@proton/payments/core/constants';
import { EntitlementName } from '@proton/payments/core/entitlements/entitlement-names';
import { EntitlementScope, EntitlementType } from '@proton/payments/core/entitlements/interface';
import type { Subscription } from '@proton/payments/core/subscription/interface';
import { buildEntitlementCatalog, catalogEntry } from '@proton/payments/testing/buildEntitlementCatalog';
import { buildSubscription } from '@proton/payments/testing/buildSubscription';
import { Renew, SubscriptionPlatform } from '@proton/shared/lib/payments/subscription/constants';

import { useAllSubscriptions } from '../../../allSubscriptions/hooks';
import { useEntitlementCatalog } from '../../../entitlementCatalog/hooks';
import { usePreviousSubscription } from '../../../previousSubscription/hooks';
import {
    type OutgoingDelegatedAccessProviderValue,
    useOutgoingController,
} from '../../shared/OutgoingDelegatedAccessProvider';
import type { OutgoingItemsResult } from '../../shared/outgoing/useOutgoingItems';
import OutgoingEmergencyContactBanners from './OutgoingEmergencyContactBanners';

jest.mock('../../../allSubscriptions/hooks', () => ({
    useAllSubscriptions: jest.fn(),
}));

jest.mock('../../../entitlementCatalog/hooks', () => ({
    useEntitlementCatalog: jest.fn(),
}));

jest.mock('../../../previousSubscription/hooks', () => ({
    usePreviousSubscription: jest.fn(),
}));

jest.mock('../../shared/OutgoingDelegatedAccessProvider', () => ({
    useOutgoingController: jest.fn(),
}));

jest.mock('@proton/components/components/link/SettingsLink', () => ({
    __esModule: true,
    default: ({ path, children }: { path: string; children: React.ReactNode }) => <a href={path}>{children}</a>,
}));

const emergencyAccessGrant = catalogEntry(EntitlementName.MaxEmergencyAccessContacts, {
    Type: EntitlementType.Value,
    Quantity: 5,
    Scope: EntitlementScope.Member,
});

const entitlementCatalog = buildEntitlementCatalog({
    [PLANS.MAIL]: [emergencyAccessGrant],
    [PLANS.DRIVE]: [emergencyAccessGrant],
    [PLANS.PASS]: [emergencyAccessGrant],
    [PLANS.VPN2024]: [{ ...emergencyAccessGrant, Quantity: 0 }],
});

const inDays = (days: number) => getUnixTime(addDays(new Date(), days)) + 60 * 60;

const ending = (plan: PLANS, days: number, override: Partial<Subscription> = {}) =>
    buildSubscription(plan, { ID: `${plan}-ending`, Renew: Renew.Disabled, PeriodEnd: inDays(days), ...override });

const renewing = (plan: PLANS, days: number) =>
    buildSubscription(plan, { ID: `${plan}-renewing`, Renew: Renew.Enabled, PeriodEnd: inDays(days) });

const renderBanners = (subscriptions: Subscription[] | undefined) => {
    jest.mocked(useAllSubscriptions).mockReturnValue([subscriptions, false] as ReturnType<typeof useAllSubscriptions>);
    return render(<OutgoingEmergencyContactBanners />);
};

const enableAutoRenewText = 'Enable auto-renew';

describe('OutgoingEmergencyContactBanners, subscription expires warning', () => {
    beforeEach(() => {
        jest.mocked(useEntitlementCatalog).mockReturnValue([entitlementCatalog, false] as ReturnType<
            typeof useEntitlementCatalog
        >);
        jest.mocked(usePreviousSubscription).mockReturnValue([
            { hasHadSubscription: false, previousSubscription: null },
            false,
        ] as ReturnType<typeof usePreviousSubscription>);
        jest.mocked(useOutgoingController).mockReturnValue({
            notify: jest.fn(),
            subscribe: jest.fn(),
            outgoingDelegatedAccess: {
                emergencyContacts: { items: [{}], hasUpsell: false },
            } as unknown as OutgoingItemsResult,
        } as OutgoingDelegatedAccessProviderValue);
    });

    it('warns with the plan, days left and reactivate link of the one ending subscription', () => {
        renderBanners([ending(PLANS.MAIL, 3)]);

        expect(screen.getByText('Mail Plus expires in 3 days.')).toBeInTheDocument();
        expect(screen.getByText("Don't lose emergency access. Enable auto-renew today.")).toBeInTheDocument();
        expect(screen.getByRole('link', { name: enableAutoRenewText })).toHaveAttribute(
            'href',
            '/dashboard#your-subscriptions'
        );
    });

    it('warns with the soonest end among several ending granting subscriptions', () => {
        renderBanners([ending(PLANS.MAIL, 6), ending(PLANS.DRIVE, 2, { External: SubscriptionPlatform.iOS })]);

        expect(screen.getByText('Drive Plus 200 GB expires in 2 days.')).toBeInTheDocument();
        expect(screen.queryByText(/Mail Plus expires/)).not.toBeInTheDocument();
        expect(screen.getByRole('link', { name: enableAutoRenewText })).toHaveAttribute(
            'href',
            'https://apps.apple.com/account/subscriptions'
        );
    });

    it.each([
        {
            name: 'renewing subscription listed first',
            subscriptions: [renewing(PLANS.PASS, 30), ending(PLANS.MAIL, 3)],
        },
        {
            name: 'renewing subscription listed second',
            subscriptions: [ending(PLANS.MAIL, 3), renewing(PLANS.PASS, 30)],
        },
    ] as const)('does not warn when another granting subscription renews ($name)', ({ subscriptions }) => {
        renderBanners([...subscriptions]);

        expect(screen.queryByText(/expires in/)).not.toBeInTheDocument();
        expect(screen.queryByRole('link', { name: enableAutoRenewText })).not.toBeInTheDocument();
    });

    it('warns when the renewing subscription does not grant emergency access', () => {
        renderBanners([renewing(PLANS.VPN2024, 30), ending(PLANS.MAIL, 3)]);

        expect(screen.getByText('Mail Plus expires in 3 days.')).toBeInTheDocument();
    });

    it.each([
        { name: 'no subscriptions (free user or member)', subscriptions: [] },
        { name: 'subscriptions still loading', subscriptions: undefined },
        { name: 'only a renewing granting subscription', subscriptions: [renewing(PLANS.MAIL, 3)] },
        { name: 'only an ending subscription without the grant', subscriptions: [ending(PLANS.VPN2024, 3)] },
        { name: 'the ending granting subscription is more than 7 days away', subscriptions: [ending(PLANS.MAIL, 8)] },
    ] as const)('does not warn for $name', ({ subscriptions }) => {
        renderBanners(subscriptions ? [...subscriptions] : undefined);

        expect(screen.queryByText(/expires in/)).not.toBeInTheDocument();
        expect(screen.queryByRole('link', { name: enableAutoRenewText })).not.toBeInTheDocument();
    });
});
