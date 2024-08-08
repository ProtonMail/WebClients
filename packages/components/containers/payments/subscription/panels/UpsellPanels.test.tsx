import { render, screen, within } from '@testing-library/react';

import { COUPON_CODES } from '@proton/shared/lib/constants';
import type { Subscription } from '@proton/shared/lib/interfaces';

import {
    familyUpsell,
    subscription,
    subscriptionBundle,
    trialMailPlusUpsell,
    unlimitedUpsell,
} from '../__mocks__/data';
import type { Upsell } from '../helpers';
import UpsellPanels from './UpsellPanels';

describe('UpsellPanel', () => {
    it('should display panels with correct details', async () => {
        const { container } = render(
            <UpsellPanels
                subscription={subscription}
                upsells={[
                    { ...unlimitedUpsell, onUpgrade: jest.fn(), isRecommended: true } as Upsell,
                    { ...familyUpsell, onUpgrade: jest.fn() } as Upsell,
                ]}
            />
        );

        expect(container.childNodes).toHaveLength(2);

        const unlimitedUpsellPanel = container.childNodes[0] as HTMLElement;
        const familyUpsellPanel = container.childNodes[1] as HTMLElement;

        expect(within(unlimitedUpsellPanel).getByText('Recommended'));
        // 1rst upsell - title
        expect(within(unlimitedUpsellPanel).getByText('Proton Unlimited'));
        //  description
        expect(
            within(unlimitedUpsellPanel).getByText(
                'Comprehensive privacy and security with all Proton services combined.'
            )
        );
        // features
        within(unlimitedUpsellPanel).getByText('500 GB storage');
        expect(within(unlimitedUpsellPanel).getByText('15 email addresses/aliases'));
        expect(within(unlimitedUpsellPanel).getByText('3 custom email domains'));
        expect(within(unlimitedUpsellPanel).getByText('25 calendars'));
        expect(within(unlimitedUpsellPanel).getByText('10 high-speed VPN connections'));
        expect(within(unlimitedUpsellPanel).getByText('Proton Pass with unlimited hide-my-email aliases'));

        expect(within(familyUpsellPanel).queryByText('Recommended')).toBeNull();
        // 2nd upsell - title
        expect(within(familyUpsellPanel).getByText('Proton Family'));
        //  description
        expect(within(familyUpsellPanel).getByText('Protect your family’s privacy with all Proton services combined.'));
        // features
        expect(within(familyUpsellPanel).getByText('3 TB storage'));
        expect(within(familyUpsellPanel).getByText('Up to 6 users'));
        expect(within(familyUpsellPanel).getByText('90 email addresses/aliases'));
        expect(within(familyUpsellPanel).getByText('10 high-speed VPN connections'));
        expect(within(familyUpsellPanel).getByText('Proton Pass with unlimited hide-my-email aliases'));
    });

    it('should display warning for trial period end', () => {
        render(
            <UpsellPanels
                subscription={
                    {
                        ...subscription,
                        CouponCode: COUPON_CODES.REFERRAL,
                        PeriodEnd: 1718870501,
                    } as Subscription
                }
                upsells={[{ ...trialMailPlusUpsell, onUpgrade: jest.fn() } as unknown as Upsell]}
            />
        );

        screen.getByText('Your trial ends June 20, 2024');
    });

    it.each([
        {
            subscription,
            trialPlanName: 'Proton Mail',
        },
        {
            subscription: subscriptionBundle,
            trialPlanName: 'Proton Unlimited',
        },
    ])('should display trial info for the correct plan - $trialPlanName', ({ subscription, trialPlanName }) => {
        render(
            <UpsellPanels
                subscription={
                    {
                        ...subscription,
                        CouponCode: COUPON_CODES.REFERRAL,
                        PeriodEnd: 1718870501,
                    } as Subscription
                }
                upsells={[{ ...trialMailPlusUpsell, onUpgrade: jest.fn() } as unknown as Upsell]}
            />
        );

        const expectedText = new RegExp(
            `To continue to use ${trialPlanName} with premium features, choose your subscription and payment options.`,
            'i'
        );

        expect(screen.getByText(expectedText)).toBeInTheDocument();
    });
});
