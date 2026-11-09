import { fireEvent, screen, within } from '@testing-library/react';

import { useAllSubscriptions } from '@proton/account/allSubscriptions/hooks';
import { useEntitlementCatalog } from '@proton/account/entitlementCatalog/hooks';
import { usePaymentMethods } from '@proton/account/paymentMethods/hooks';
import { useReferralInfo } from '@proton/account/referralInfo/hooks';
import { useUser } from '@proton/account/user/hooks';
import { PLANS, PLAN_NAMES } from '@proton/payments/core/constants';
import { EntitlementName } from '@proton/payments/core/entitlements/entitlement-names';
import type { Subscription } from '@proton/payments/core/subscription/interface';
import { buildEntitlementCatalog } from '@proton/payments/testing/buildEntitlementCatalog';
import { buildSubscription } from '@proton/payments/testing/buildSubscription';
import { APPS } from '@proton/shared/lib/constants';
import { Renew, SubscriptionPlatform, TrialType } from '@proton/shared/lib/payments/subscription/constants';
import { buildUser } from '@proton/shared/testing/buildUser';

import { renderWithProviders } from '../../../../testing/renderWithProviders';
import { CancelSubscriptionSection } from './CancelSubscriptionSection';

const mockStartCancellation = jest.fn();

jest.mock('@proton/account/allSubscriptions/hooks');
jest.mock('@proton/account/entitlementCatalog/hooks');
jest.mock('@proton/account/paymentMethods/hooks');
jest.mock('@proton/account/referralInfo/hooks');
jest.mock('@proton/account/user/hooks');
jest.mock('./useStartCancellation', () => ({
    useStartCancellation: () => ({
        startCancellation: (subscription: Subscription) => mockStartCancellation(subscription.ID),
        modals: null,
        loading: false,
    }),
}));

jest.mocked(useUser).mockReturnValue([buildUser({ isPaid: true, isFree: false }), false] as any);
jest.mocked(usePaymentMethods).mockReturnValue([[], false] as any);
jest.mocked(useReferralInfo).mockReturnValue([{ uiData: { referrerRewardAmount: 'CHF 20' } }] as any);
jest.mocked(useEntitlementCatalog).mockReturnValue([
    buildEntitlementCatalog({
        [PLANS.MAIL]: [EntitlementName.FlagsInbox],
        [PLANS.LUMO]: [EntitlementName.FlagsLumo],
        [PLANS.DRIVE]: [EntitlementName.FlagsDrive],
    }),
    false,
] as any);

const mail: Subscription = { ...buildSubscription(PLANS.MAIL), ID: 'sub-mail' };
const lumo: Subscription = { ...buildSubscription(PLANS.LUMO), ID: 'sub-lumo' };
const cancelledLumo: Subscription = { ...lumo, Renew: Renew.Disabled };
const androidDrive: Subscription = {
    ...buildSubscription(PLANS.DRIVE),
    ID: 'sub-drive',
    External: SubscriptionPlatform.Android,
};

const renderSection = (subscriptions: Subscription[]) => {
    jest.mocked(useAllSubscriptions).mockReturnValue([subscriptions, false] as any);
    return renderWithProviders(<CancelSubscriptionSection app={APPS.PROTONACCOUNT} />);
};

const getMenuItem = (planName: string) => screen.getByRole('button', { name: new RegExp(`^Cancel ${planName}`) });

beforeEach(() => {
    mockStartCancellation.mockClear();
});

describe('CancelSubscriptionSection', () => {
    it('names the plan it cancels for the only web subscription', () => {
        renderSection([mail]);

        expect(screen.getByText(/you will be downgraded to the Proton Free plan/)).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: `Cancel ${PLAN_NAMES[PLANS.MAIL]}` }));

        expect(mockStartCancellation).toHaveBeenCalledWith('sub-mail');
    });

    it('lets the user pick which of several web subscriptions to cancel', () => {
        renderSection([mail, lumo]);

        expect(
            screen.getByText(
                /Choose the one to cancel: your other subscriptions aren't affected. A cancelled subscription won't be renewed/
            )
        ).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'Cancel subscription' }));
        expect(getMenuItem(PLAN_NAMES[PLANS.MAIL]).textContent).toBe(`Cancel ${PLAN_NAMES[PLANS.MAIL]}`);
        fireEvent.click(getMenuItem(PLAN_NAMES[PLANS.LUMO]));

        expect(mockStartCancellation).toHaveBeenCalledTimes(1);
        expect(mockStartCancellation).toHaveBeenCalledWith('sub-lumo');
    });

    it('cancels the only subscription still renewing when another one is already cancelled', () => {
        renderSection([cancelledLumo, mail]);

        expect(screen.queryByRole('button', { name: /Lumo/ })).not.toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: `Cancel ${PLAN_NAMES[PLANS.MAIL]}` }));

        expect(mockStartCancellation).toHaveBeenCalledWith('sub-mail');
    });

    it('warns on the item of a referral trial that cancelling loses the credit reward', () => {
        const referralTrialMail: Subscription = { ...mail, IsTrial: true, TrialType: TrialType.ReferralProgram };
        renderSection([referralTrialMail, lumo]);

        fireEvent.click(screen.getByRole('button', { name: 'Cancel subscription' }));

        expect(getMenuItem(PLAN_NAMES[PLANS.MAIL])).toHaveTextContent(
            "When you cancel, your subscription won't start after the trial period.If you cancel, you will lose your CHF 20 credit reward."
        );
        expect(getMenuItem(PLAN_NAMES[PLANS.LUMO])).not.toHaveTextContent('credit reward');
    });

    it('offers a store subscription next to a web one, so the user learns to cancel it in the store', () => {
        renderSection([mail, androidDrive]);

        fireEvent.click(screen.getByRole('button', { name: 'Cancel subscription' }));
        const driveItem = getMenuItem(PLAN_NAMES[PLANS.DRIVE]);
        expect(driveItem).toHaveTextContent('You cancel it in the store.');
        fireEvent.click(driveItem);

        expect(mockStartCancellation).toHaveBeenCalledWith('sub-drive');
    });

    it('tells apart the same plan bought on the web and in a store by the store badge', () => {
        const iosLumo: Subscription = { ...lumo, ID: 'sub-lumo-ios', External: SubscriptionPlatform.iOS };
        renderSection([lumo, iosLumo]);

        fireEvent.click(screen.getByRole('button', { name: 'Cancel subscription' }));
        const [webItem, storeItem] = screen.getAllByRole('button', {
            name: new RegExp(`^Cancel ${PLAN_NAMES[PLANS.LUMO]}`),
        });

        expect(within(webItem).queryByTestId('subscriptionStoreBadge')).not.toBeInTheDocument();
        expect(within(storeItem).getByTestId('subscriptionStoreBadge')).toHaveTextContent('Apple App Store');
        fireEvent.click(storeItem);

        expect(mockStartCancellation).toHaveBeenCalledWith('sub-lumo-ios');
    });

    it('offers to cancel the only subscription when it comes from a store', () => {
        renderSection([androidDrive]);

        fireEvent.click(screen.getByRole('button', { name: `Cancel ${PLAN_NAMES[PLANS.DRIVE]}` }));

        expect(mockStartCancellation).toHaveBeenCalledWith('sub-drive');
    });

    it('names the trial it cancels for the only subscription', () => {
        renderSection([{ ...mail, IsTrial: true, TrialType: TrialType.ReferralProgram }]);

        fireEvent.click(screen.getByRole('button', { name: `Cancel ${PLAN_NAMES[PLANS.MAIL]} trial` }));

        expect(mockStartCancellation).toHaveBeenCalledWith('sub-mail');
    });

    it('renders nothing when no subscription can be cancelled', () => {
        const { container } = renderSection([cancelledLumo]);

        expect(container).toBeEmptyDOMElement();
    });
});
