import type { FC, ReactNode } from 'react';
import { isValidElement } from 'react';
import { useLocation } from 'react-router-dom';

import { c } from 'ttag';

import { getSimplePriceString } from '@proton/components/components/price/helper';
import { getPassCliText } from '@proton/components/containers/payments/features/pass';
import { IcCheckmarkCircleFilled } from '@proton/icons/icons/IcCheckmarkCircleFilled';
import { useAsyncModalHandles } from '@proton/pass/hooks/useAsyncModalHandles';
import type { PlanIDs } from '@proton/payments';
import { CYCLE, PLANS, PLAN_NAMES } from '@proton/payments';
import { usePaymentOptimistic } from '@proton/payments/ui';
import { BRAND_NAME, DARK_WEB_MONITORING_NAME, PASS_APP_NAME } from '@proton/shared/lib/constants';

import { Layout } from '../components/Layout/Layout';
import { OfferModal } from '../components/OfferModal/OfferModal';
import { PlanCard, type PlanCardProps } from '../components/PlansTable/PlanCard';
import { family, getPassPlusOfferPlan, passPlus, unlimited } from '../plans';

type Props = {
    onContinue: (payment: boolean, skipCycle?: boolean) => Promise<void>;
};

export const UpgradePlanStep: FC<Props> = ({ onContinue }) => {
    const payments = usePaymentOptimistic();
    const location = useLocation();

    const offerModal = useAsyncModalHandles<boolean, object>({ getInitialModalState: () => ({}) });

    const getPrice = (planIDs: PlanIDs) => {
        const price = payments.getPriceOrFallback({
            planIDs,
            cycle: CYCLE.YEARLY,
            currency: payments.selectedPlan.currency,
        });

        return getSimplePriceString(price.checkoutUi.currency, price.checkoutUi.withDiscountPerMonth);
    };

    const handlePayPlan = (plan: PLANS, coupon?: string) => {
        payments.selectPlan({
            planIDs: { [plan]: 1 },
            cycle: CYCLE.YEARLY,
            currency: payments.selectedPlan.currency,
            coupon,
        });
        void onContinue(true);
    };

    const openOfferModal = () =>
        offerModal.handler({
            onSubmit: async (upgradeTo) => {
                if (upgradeTo) {
                    payments.selectPlan(getPassPlusOfferPlan(payments.selectedPlan.currency));
                    return onContinue(true, true);
                }

                await onContinue(false);
            },
        });

    const searchParams = new URLSearchParams(location.search);
    const highlightUnlimitedFlag = searchParams.has('unlimited');

    // Using same variable name in translations as a duplicate key in OAuthConfirmForkContainer
    const name = PASS_APP_NAME;

    const plans: PlanCardProps[] = [
        {
            title: c('Title').t`Free`,
            price: getPrice({}),
            priceSubtitle: c('Subtitle').t`Free forever`,
            // translator: variable here is the name of the service to login to. Complete sentence: "Continue to Proton Pass"
            buttonText: c('Action').t`Continue to ${name}`,
            buttonAction: openOfferModal,
            features: [
                c('Label').t`Secure password generator`,
                c('Label').t`10 hide-my-email aliases`,
                c('Label').t`Unlimited logins and devices`,
            ],
        },
        {
            title: (
                <div className="flex items-center gap-2" key="plus-title">
                    {PLAN_NAMES[PLANS.PASS]}
                    {!highlightUnlimitedFlag && (
                        <IcCheckmarkCircleFilled size={5} color="var(--optional-promotion-text-weak)" />
                    )}
                </div>
            ),
            price: getPrice(passPlus.planIDs),
            priceSubtitle: c('Subtitle').t`per month, billed annually`,
            buttonText: c('Action').t`Get Pass Plus`,
            buttonShape: highlightUnlimitedFlag ? 'outline' : 'solid',
            buttonAction: () => handlePayPlan(PLANS.PASS),
            recommended: !highlightUnlimitedFlag,
            featuresTitle: c('Label').t`Get everything in Free, plus:`,
            features: [
                c('Label').t`Unlimited hide-my-email aliases`,
                c('Label').t`Built-in 2FA authenticator`,
                c('Label').t`Vault, item & secure link sharing`,
                DARK_WEB_MONITORING_NAME,
                c('Label').t`File attachments (up to 10GB)`,
                getPassCliText(),
            ],
        },
        {
            title: PLAN_NAMES[PLANS.PASS_FAMILY],
            price: getPrice(family.planIDs),
            priceSubtitle: c('Subtitle').t`per month, billed annually`,
            buttonText: c('Action').t`Get Pass Family`,
            buttonAction: () => handlePayPlan(PLANS.PASS_FAMILY),
            featuresTitle: c('Label').t`Online privacy for your whole family`,
            features: [c('Label').t`6 Pass Plus accounts`, c('Label').t`Admin panel for your family`],
        },
        {
            title: (
                <div className="flex items-center gap-2" key="unlimited-title">
                    {PLAN_NAMES[PLANS.BUNDLE]}
                    {highlightUnlimitedFlag && (
                        <IcCheckmarkCircleFilled size={5} color="var(--optional-promotion-text-weak)" />
                    )}
                </div>
            ),
            price: getPrice(unlimited.planIDs),
            priceSubtitle: c('Subtitle').t`per month, billed annually`,
            buttonText: c('Action').t`Get the full suite`,
            buttonShape: highlightUnlimitedFlag ? 'solid' : 'outline',
            buttonAction: () => handlePayPlan(PLANS.BUNDLE),
            recommended: highlightUnlimitedFlag,
            showProducts: true,
            featuresTitle: c('Label').t`The best of ${BRAND_NAME} with one subscription`,
            features: [
                c('Label').t`500 GB Storage`,
                c('Label').t`15 extra email addresses`,
                c('Label').t`10 VPN devices`,
                c('Label').t`Highest VPN speed`,
            ],
        },
    ];

    const getKey = (node: ReactNode) => (isValidElement(node) ? node.key : String(node));

    return (
        <Layout>
            <div className="flex flex-column items-center w-full mt-3">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-y-8">
                    {plans.map((plan) => (
                        <PlanCard key={getKey(plan.title)} {...plan} />
                    ))}
                </div>
            </div>
            {offerModal.state.open && (
                <OfferModal
                    checkoutUi={
                        payments.getPriceOrFallback(getPassPlusOfferPlan(payments.selectedPlan.currency)).checkoutUi
                    }
                    onClose={offerModal.abort}
                    onContinue={offerModal.resolver}
                    loading={offerModal.state.loading}
                />
            )}
        </Layout>
    );
};
