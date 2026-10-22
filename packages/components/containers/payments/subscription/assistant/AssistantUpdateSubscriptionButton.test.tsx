import { render, screen } from '@testing-library/react';

import { useAllSubscriptions } from '@proton/account/allSubscriptions/hooks';
import { buildUser } from '@proton/account/testing/buildUser';
import { useUser } from '@proton/account/user/hooks';
import { PLANS } from '@proton/payments/core/constants';
import { buildSubscription } from '@proton/payments/testing/buildSubscription';

import AssistantUpdateSubscriptionButton from './AssistantUpdateSubscriptionButton';

jest.mock('@proton/account/allSubscriptions/hooks', () => ({
    useAllSubscriptions: jest.fn(),
}));

jest.mock('@proton/account/user/hooks', () => ({
    useUser: jest.fn(),
}));

jest.mock('../../../../components/link/SettingsLink', () => ({
    __esModule: true,
    default: ({ path, children }: { path: string; children: string }) => <a href={path}>{children}</a>,
}));

const renderCheckoutParams = (plans: PLANS[]) => {
    jest.mocked(useUser).mockReturnValue([buildUser(), false]);
    jest.mocked(useAllSubscriptions).mockReturnValue([plans.map((plan) => buildSubscription(plan)), false]);
    render(<AssistantUpdateSubscriptionButton />);

    const href = screen.getByRole('link', { name: 'Add to your subscription' }).getAttribute('href') ?? '';
    const [pathname, search] = href.split('?');
    const params = new URLSearchParams(search);
    return { pathname, plan: params.get('plan'), target: params.get('target') };
};

describe('AssistantUpdateSubscriptionButton', () => {
    it('opens checkout on the plan of the only subscription', () => {
        expect(renderCheckoutParams([PLANS.MAIL_PRO])).toEqual({
            pathname: '/dashboard',
            plan: 'mailpro2022',
            target: 'checkout',
        });
    });

    it('opens checkout on the subscription that supports the addon when it is not the first one', () => {
        expect(renderCheckoutParams([PLANS.PASS_PRO, PLANS.MAIL_PRO])).toEqual({
            pathname: '/dashboard',
            plan: 'mailpro2022',
            target: 'checkout',
        });
    });

    it('falls back to the first subscription when none supports the addon', () => {
        expect(renderCheckoutParams([PLANS.PASS_PRO])).toEqual({
            pathname: '/dashboard',
            plan: 'passpro2024',
            target: 'checkout',
        });
    });

    it('falls back to Unlimited without readable subscriptions', () => {
        expect(renderCheckoutParams([])).toEqual({
            pathname: '/dashboard',
            plan: PLANS.BUNDLE,
            target: 'checkout',
        });
    });
});
