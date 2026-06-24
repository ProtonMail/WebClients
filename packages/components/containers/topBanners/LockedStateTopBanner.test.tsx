import { screen } from '@testing-library/react';

import { useGetPreviousSubscription } from '@proton/account/previousSubscription/hooks';
import { getModelState } from '@proton/account/test';
import { CYCLE, PLANS } from '@proton/payments/core/constants';
import type { PreviousSubscription } from '@proton/payments/core/interface';
import { SubscriptionPlatform } from '@proton/payments/core/subscription/constants';
import { UserLockedFlags } from '@proton/shared/lib/interfaces';
import { buildSubscription } from '@proton/testing/builders/subscription';
import { buildUser } from '@proton/testing/builders/user';
import { renderWithProviders } from '@proton/testing/lib/context/renderWithProviders';

import { LockedStateTopBanner } from './LockedStateTopBanner';

jest.mock('@proton/account/previousSubscription/hooks', () => ({
    useGetPreviousSubscription: jest.fn(),
}));

const useGetPreviousSubscriptionMock = useGetPreviousSubscription as jest.MockedFunction<
    typeof useGetPreviousSubscription
>;

const previousSubscription: PreviousSubscription = {
    cycle: CYCLE.YEARLY,
    currency: 'EUR',
    periodStart: 1,
    periodEnd: 2,
    createTime: 0,
    cancelTime: 3,
    couponCode: null,
    external: SubscriptionPlatform.Default,
    isTrial: false,
    plans: { [PLANS.BUNDLE_PRO_2024]: 1 },
};

describe('LockedStateTopBanner', () => {
    const user = buildUser();
    const getPreviousSubscription = jest.fn();

    beforeEach(() => {
        getPreviousSubscription.mockResolvedValue(undefined);
        useGetPreviousSubscriptionMock.mockReturnValue(getPreviousSubscription);
    });

    afterEach(() => {
        getPreviousSubscription.mockReset();
    });

    it('uses the current subscription plan for regular locked storage upgrade paths', () => {
        const subscription = buildSubscription(PLANS.BUNDLE);

        renderWithProviders(
            <LockedStateTopBanner
                app="proton-mail"
                user={user}
                subscription={subscription}
                upsellRef="locked-storage"
                lockedFlags={UserLockedFlags.BASE_STORAGE_EXCEEDED}
            />
        );

        expect(getPreviousSubscription).not.toHaveBeenCalled();
        expect(screen.getByRole('link', { name: 'upgrade for more storage' })).toHaveAttribute(
            'href',
            expect.stringContaining(`/dashboard?plan=${PLANS.BUNDLE}&target=compare&ref=locked-storage`)
        );
    });

    it('falls back to the Drive plan for regular locked storage upgrade paths in Drive', () => {
        renderWithProviders(
            <LockedStateTopBanner
                app="proton-drive"
                user={user}
                subscription={undefined}
                upsellRef={undefined}
                lockedFlags={UserLockedFlags.DRIVE_STORAGE_EXCEEDED}
            />
        );

        expect(getPreviousSubscription).not.toHaveBeenCalled();
        expect(screen.getByRole('link', { name: 'upgrade for more storage' })).toHaveAttribute(
            'href',
            expect.stringContaining(`/dashboard?plan=${PLANS.DRIVE}&target=compare`)
        );
    });

    it('falls back to the Mail plan for regular locked storage upgrade paths outside Drive', () => {
        renderWithProviders(
            <LockedStateTopBanner
                app="proton-mail"
                user={user}
                subscription={undefined}
                upsellRef={undefined}
                lockedFlags={UserLockedFlags.BASE_STORAGE_EXCEEDED}
            />
        );

        expect(getPreviousSubscription).not.toHaveBeenCalled();
        expect(screen.getByRole('link', { name: 'upgrade for more storage' })).toHaveAttribute(
            'href',
            expect.stringContaining(`/dashboard?plan=${PLANS.MAIL}&target=compare`)
        );
    });

    it('uses the previous subscription plan and checkout target for primary admins restoring access', () => {
        renderWithProviders(
            <LockedStateTopBanner
                app="proton-mail"
                user={user}
                subscription={undefined}
                upsellRef={undefined}
                lockedFlags={UserLockedFlags.ORG_ISSUE_FOR_PRIMARY_ADMIN}
            />,
            {
                preloadedState: {
                    previousSubscription: getModelState({
                        hasHadSubscription: true,
                        previousSubscription,
                    }),
                },
            }
        );

        expect(getPreviousSubscription).toHaveBeenCalledTimes(1);
        expect(screen.getByRole('link', { name: 'Upgrade to restore full access' })).toHaveAttribute(
            'href',
            expect.stringContaining(`/dashboard?plan=${PLANS.BUNDLE_PRO_2024}&target=checkout`)
        );
    });

    it('uses compare target when primary admins have no current or previous subscription plan', () => {
        renderWithProviders(
            <LockedStateTopBanner
                app="proton-mail"
                user={user}
                subscription={undefined}
                upsellRef={undefined}
                lockedFlags={UserLockedFlags.ORG_ISSUE_FOR_PRIMARY_ADMIN}
            />,
            {
                preloadedState: {
                    previousSubscription: getModelState({
                        hasHadSubscription: false,
                        previousSubscription: null,
                    }),
                },
            }
        );

        expect(getPreviousSubscription).toHaveBeenCalledTimes(1);
        expect(screen.getByRole('link', { name: 'Upgrade to restore full access' })).toHaveAttribute(
            'href',
            expect.stringContaining('target=compare')
        );
    });
});
