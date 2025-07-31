import type { FC } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/src';
import { Icon } from '@proton/components';
import { getSimplePriceString } from '@proton/components/components/price/helper';
import {
    PASS_FAMILY_PRICE,
    PASS_PLUS_LIFETIME_PRICE,
    PASS_PLUS_PRICE,
    PROTON_UNLIMITED_PRICE,
} from '@proton/pass/constants';
import { useAsyncModalHandles } from '@proton/pass/hooks/useAsyncModalHandles';
import { PLANS } from '@proton/payments/core/constants';

import { Layout } from '../components/Layout/Layout';
import { type OfferContinueAction, OfferModal } from '../components/OfferModal/OfferModal';
import { PlanCard, type PlanCardProps } from '../components/PlansTable/PlanCard';
import { Step, useFlow } from '../contexts/FlowContext';

// TODO: Retrieve the user currency if possible
const getPrice = (price: number) => getSimplePriceString('USD', price);

export const UpgradePlanStep: FC = () => {
    const { setStep } = useFlow();
    const offerModal = useAsyncModalHandles<void, object>({ getInitialModalState: () => ({}) });

    const plusLifetimePrice = getPrice(PASS_PLUS_LIFETIME_PRICE);

    const handlePayPlan = (plan: PLANS) => setStep(Step.Payment, { plan });

    const openOfferModal = () => offerModal.handler({ onSubmit: () => {} });

    const plans: PlanCardProps[] = [
        {
            title: c('Title').t`Free`,
            price: getPrice(0),
            priceSubtitle: c('Subtitle').t`Free forever`,
            buttonText: c('Action').t`Continue to Proton Pass`,
            buttonAction: openOfferModal,
            features: [
                c('Label').t`Secure password generator`,
                c('Label').t`10 Hide-my-email aliases`,
                c('Label').t`Unlimited logins and devices`,
            ],
        },
        {
            title: c('Title').t`Plus`,
            price: getPrice(PASS_PLUS_PRICE),
            priceSubtitle: c('Subtitle').t`per month, billed annually`,
            buttonText: c('Action').t`Get Pass Plus`,
            buttonAction: () => handlePayPlan(PLANS.PASS),
            featuresTitle: c('Label').t`Get everything in Free, plus:`,
            features: [
                c('Label').t`Unlimited Hide-my-email aliases`,
                c('Label').t`Built-in 2FA authenticator`,
                c('Label').t`Vault, item & secure link sharing`,
                c('Label').t`Credit cards`,
                c('Label').t`Dark Web Monitoring`,
                c('Label').t`File attachments`,
            ],
        },
        {
            title: c('Title').t`Family`,
            price: getPrice(PASS_FAMILY_PRICE),
            priceSubtitle: c('Subtitle').t`per month, billed annually`,
            buttonText: c('Action').t`Get Pass Family`,
            buttonAction: () => handlePayPlan(PLANS.PASS_FAMILY),
            featuresTitle: c('Label').t`Online privacy for your whole family`,
            features: [c('Label').t`6 Pass Plus accounts`, c('Label').t`Admin panel for your family`],
        },
        {
            title: (
                <div className="flex items-center gap-2">
                    {c('Title').t`Proton Unlimited`}
                    <Icon name="checkmark-circle-filled" size={5} color="var(--optional-promotion-text-weak)" />
                </div>
            ),
            price: getPrice(PROTON_UNLIMITED_PRICE),
            priceSubtitle: c('Subtitle').t`per month, billed annually`,
            buttonText: c('Action').t`Get the full suite`,
            buttonShape: 'solid',
            buttonAction: () => handlePayPlan(PLANS.BUNDLE),
            showProducts: true,
            recommended: true,
            featuresTitle: c('Label').t`The best of Proton with one subscription`,
            features: [
                c('Label').t`500 GB Storage`,
                c('Label').t`15 Extra email addresses`,
                c('Label').t`10 VPN Devices`,
                c('Label').t`Highest VPN Speed`,
            ],
        },
    ];

    return (
        <Layout>
            <div className="flex flex-column items-center w-full">
                <div className="pass-plan-card-grid">
                    {plans.map((plan) => (
                        <PlanCard key={String(plan.title)} {...plan} />
                    ))}
                </div>
                <div className="relative flex items-center justify-center border-gradient rounded-lg mt-12 p-6 gap-4">
                    <div
                        className="banner-gradient-bg absolute top-custom left-custom color-invert text-semibold text-xs px-2 text-center text-ellipsis rounded-sm"
                        style={{ '--top-custom': '-0.5rem', '--left-custom': '1rem' }}
                    >{c('Label').t`Limited time`}</div>
                    <div>
                        <h3 className="text-bold">{c('Title').t`Pass Plus Lifetime for ${plusLifetimePrice}`}</h3>
                        <h4 className="text-sm color-weak">{c('Subtitle').t`Pay once, access forever.`}</h4>
                    </div>
                    <Button
                        size="large"
                        color="norm"
                        shape="outline"
                        pill
                        onClick={() => handlePayPlan(PLANS.PASS_LIFETIME)}
                        className="md:ml-16 md:px-14"
                    >
                        {c('Action').t`Pay once`}
                    </Button>
                </div>
            </div>
            {offerModal.state.open && (
                <OfferModal
                    rawPrice={PASS_FAMILY_PRICE}
                    getPrice={getPrice}
                    onClose={offerModal.abort}
                    onContinue={({ upgradeTo }: OfferContinueAction) =>
                        upgradeTo ? handlePayPlan(upgradeTo) : setStep(Step.InstallExtension)
                    }
                />
            )}
        </Layout>
    );
};
