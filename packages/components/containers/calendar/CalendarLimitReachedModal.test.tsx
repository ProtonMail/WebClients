import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { useAllSubscriptions } from '@proton/account/allSubscriptions/hooks';
import { useEntitlementCatalog } from '@proton/account/entitlementCatalog/hooks';
import { mockUseConfig } from '@proton/app-context/testing/mockUseConfig';
import { PLANS } from '@proton/payments/core/constants';
import { EntitlementName } from '@proton/payments/core/entitlements/entitlement-names';
import { buildEntitlementCatalog } from '@proton/payments/testing/buildEntitlementCatalog';
import { buildSubscription } from '@proton/payments/testing/buildSubscription';
import { APPS } from '@proton/shared/lib/constants';
import type { UserModel } from '@proton/shared/lib/interfaces/User';

import { mockUseAuthentication } from '../../testing/mockUseAuthentication';
import { mockUseLocation } from '../../testing/mockUseLocation';
import CalendarLimitReachedModal from './CalendarLimitReachedModal';

jest.mock('@proton/account/allSubscriptions/hooks', () => ({
    useAllSubscriptions: jest.fn(),
}));

jest.mock('@proton/account/entitlementCatalog/hooks', () => ({
    useEntitlementCatalog: jest.fn(),
}));

const catalog = buildEntitlementCatalog({
    [PLANS.VPN2024]: [EntitlementName.FlagsVpn],
    [PLANS.MAIL]: [EntitlementName.FlagsInbox],
    [PLANS.DRIVE]: [EntitlementName.FlagsDrive],
});

describe('CalendarLimitReachedModal', () => {
    beforeEach(() => {
        mockUseLocation();
        mockUseConfig();
        mockUseAuthentication({ mode: '' } as any);
        jest.mocked(useAllSubscriptions).mockReturnValue([[], false]);
        jest.mocked(useEntitlementCatalog).mockReturnValue([catalog, false]);
    });

    describe('when user is free', () => {
        it('should render correct prompt', async () => {
            const onClose = jest.fn();
            const user = { isFree: true } as UserModel;
            render(<CalendarLimitReachedModal user={user} open onClose={onClose} isFreeUser />);

            expect(screen.getByRole('heading', { level: 1, name: /Cannot add more calendars/ }));

            expect(screen.getByText("You've reached the maximum number of calendars available in your plan."));
            expect(
                screen.getByText(
                    'To add a new calendar, remove another calendar or upgrade your Proton plan to a Mail paid plan.'
                )
            );

            const link = screen.getByRole('link', { name: /Upgrade/ });
            expect(link).toHaveAttribute('href', '/mail/upgrade?ref=upsell_calendar-modal-max-cal');

            const button = screen.getByRole('button', { name: /Cancel/ });
            await userEvent.click(button);
            await waitFor(() => {
                expect(onClose).toHaveBeenCalledTimes(1);
            });
        });
    });

    describe('when user pays only for products other than Mail', () => {
        const user = { isFree: false, isPaid: true } as UserModel;

        it('preselects the plan of the subscription that covers Calendar', () => {
            jest.mocked(useAllSubscriptions).mockReturnValue([
                [buildSubscription(PLANS.VPN2024), buildSubscription(PLANS.MAIL)],
                false,
            ]);

            render(<CalendarLimitReachedModal user={user} open isFreeUser />);

            expect(screen.getByRole('link', { name: /Upgrade/ })).toHaveAttribute(
                'href',
                '/mail/dashboard?ref=upsell_calendar-modal-max-cal&target=compare&plan=mail2022'
            );
        });

        it('preselects the first subscription when none covers Calendar, even in an app another subscription covers', () => {
            mockUseConfig({ APP_NAME: APPS.PROTONDRIVE });
            jest.mocked(useAllSubscriptions).mockReturnValue([
                [buildSubscription(PLANS.VPN2024), buildSubscription(PLANS.DRIVE)],
                false,
            ]);

            render(<CalendarLimitReachedModal user={user} open isFreeUser />);

            expect(screen.getByRole('link', { name: /Upgrade/ })).toHaveAttribute(
                'href',
                '/drive/dashboard?ref=upsell_calendar-modal-max-cal&target=compare&plan=vpn2024'
            );
        });
    });

    describe('when user is paid', () => {
        it('should render correct prompt', async () => {
            const onClose = jest.fn();
            const user = { isPaid: true } as UserModel;
            render(<CalendarLimitReachedModal user={user} open onClose={onClose} isFreeUser={false} />);

            expect(screen.getByRole('heading', { level: 1, name: /Cannot add more calendars/ }));

            expect(screen.getByText("You've reached the maximum number of calendars available in your plan."));
            expect(screen.getByText('To add a new calendar, remove an existing one.'));

            const link = screen.getByRole('link', { name: /Manage/ });
            expect(link).toHaveAttribute('href', '/mail/calendars');

            const button = screen.getByRole('button', { name: /Cancel/ });
            await userEvent.click(button);
            await waitFor(() => {
                expect(onClose).toHaveBeenCalledTimes(1);
            });
        });
    });
});
