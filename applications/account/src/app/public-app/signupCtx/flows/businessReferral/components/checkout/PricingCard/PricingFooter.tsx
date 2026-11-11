import { c } from 'ttag';

import type { CheckoutView } from '@proton/payments-ui/ui/headless-checkout/checkout-view';

interface Props {
    checkoutView: CheckoutView;
    hasFullCheckoutDetails: boolean;
}

/**
 * Row order follows the design: users/addons, divider, "Total for X months" (with its VAT note),
 * divider, "Amount due", renewal notice. Legacy only shows one of the two amount rows (based on
 * hasBreakdown), but the design always shows both. The renewal notice is a block in this same
 * `gap-2` flex column (not a separately-padded sibling outside it) so it picks up the same 8px
 * rhythm as every other row instead of a bespoke gap.
 */
export const PricingFooter = ({ checkoutView, hasFullCheckoutDetails }: Props) => {
    const { checkoutData } = checkoutView;
    const { renewalTime } = checkoutView.getItem('nextBilling');

    const showDivider = !checkoutData.isTrial && !checkoutData.isTaxReverseCharged;
    const divider = showDivider && (
        <div className="py-2">
            <hr className="m-0 bg-weak" />
        </div>
    );

    const hasNotice =
        hasFullCheckoutDetails ||
        checkoutView.getItem('renewalNotice').visible ||
        checkoutView.getItem('vatReverseCharge').visible;

    return (
        <div className="flex flex-column gap-3">
            <div className="flex flex-column gap-3">
                {checkoutView.render('members')}
                {checkoutView.render('addons')}
                {checkoutView.render('discount', { ignoreVisibility: true })}
            </div>
            {divider}
            <div>{checkoutView.render('amountDue', { variant: 'total' })}</div>
            {divider}
            <div>{checkoutView.render('amountDue')}</div>
            {hasNotice && (
                <div className="flex flex-column gap-2">
                    {hasFullCheckoutDetails && (
                        <div className="text-sm color-weak">
                            {
                                // translator: Full sentence is: Billed yearly, renews on October 12th, 2027
                                c('Signup').t`Billed yearly, renews on ${renewalTime}`
                            }
                        </div>
                    )}
                    {checkoutView.render('renewalNotice')}
                    {checkoutView.render('vatReverseCharge')}
                </div>
            )}
        </div>
    );
};
