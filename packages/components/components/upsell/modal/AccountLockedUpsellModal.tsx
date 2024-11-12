import { useEffect, useState } from 'react';

import { getLocaleTermsURL } from 'proton-account/src/app/content/helper';
import { c } from 'ttag';

import { usePaymentStatus } from '@proton/account/paymentStatus/hooks';
import { usePlans } from '@proton/account/plans/hooks';
import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import { ButtonLike, Href } from '@proton/atoms';
import { useConfig } from '@proton/components';
import { Option, Price, SUBSCRIPTION_STEPS, SelectTwo, SettingsLink, useUpsellConfig } from '@proton/components';
import ModalTwo, { type ModalProps } from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import UpsellFeatureList from '@proton/components/components/upsell/modal/UpsellFeatureList';
import type { UpsellFeatureName } from '@proton/components/components/upsell/modal/constants';
import { getPrice } from '@proton/components/containers/payments/subscription/PlanSelection';
import useApi from '@proton/components/hooks/useApi';
import { useCurrencies } from '@proton/components/payments/client-extensions';
import type { Currency } from '@proton/payments';
import { PLANS, getPlansMap } from '@proton/payments';
import { APPS, APP_UPSELL_REF_PATH, CYCLE, MAIL_UPSELL_PATHS, UPSELL_COMPONENT } from '@proton/shared/lib/constants';
import { getCanSubscriptionAccessDuoPlan } from '@proton/shared/lib/helpers/subscription';
import { UPSELL_MODALS_TYPE, getUpsellRef, sendRequestUpsellModalReport } from '@proton/shared/lib/helpers/upsell';
import { getAbuseURL } from '@proton/shared/lib/helpers/url';
import type { Plan } from '@proton/shared/lib/interfaces';
import accountLockedImage from '@proton/styles/assets/img/illustrations/account-locked.svg';
import isTruthy from '@proton/utils/isTruthy';

interface PlanOption {
    plan: Plan;
    price: number;
}

const cycle = CYCLE.YEARLY;
const PlanSelect = ({
    onChange,
    options,
    value: plan,
    currency,
    loading,
}: {
    options: PlanOption[];
    onChange: (plan: Plan) => void;
    value?: Plan;
    currency: Currency;
    loading: boolean;
}) => {
    return (
        <SelectTwo
            className="h-custom"
            style={{ '--h-custom': '3.8rem' }}
            value={plan}
            onChange={({ value }) => onChange(value)}
            loading={loading}
            renderSelected={(plan) => {
                const option = options.find((v) => v.plan.Name === plan?.Name);
                if (!option) {
                    return null;
                }
                return (
                    <div>
                        <div className="color-hint text-sm">Plan</div>
                        <div className="flex justify-space-between text-bold text-lg pr-4">
                            <span>{option.plan.Title}</span>
                            <span>
                                <Price currency={currency}>{option.price / cycle}</Price>
                                {c('Label').t`/month`}
                            </span>
                        </div>
                    </div>
                );
            }}
        >
            {options.map(({ plan, price }) => {
                return (
                    <Option value={plan} title={plan.Title} key={plan.ID}>
                        <div className="flex justify-space-between">
                            <span className="mr-4 text-bold">{plan.Title}</span>
                            <span>
                                <Price currency={currency}>{price / cycle}</Price>
                                {c('Label').t`/month`}
                            </span>
                        </div>
                    </Option>
                );
            })}
        </SelectTwo>
    );
};

interface AccountLockedUpsellModalProps extends ModalProps {
    onSubscribed: () => void;
}

const features: UpsellFeatureName[] = [
    'breach-alerts',
    'password-health',
    'account-protection',
    'storage-by-plan',
    'address-by-plan',
];

const AccountLockedUpsellModal = ({ onSubscribed, ...rest }: AccountLockedUpsellModalProps) => {
    const { APP_NAME } = useConfig();
    const api = useApi();
    const [selectedPlan, setSelectedPlan] = useState<Plan | undefined>();
    const [plansResult, planResultLoading] = usePlans();
    const [user] = useUser();
    const [paymentStatus] = usePaymentStatus();
    const [subscription] = useSubscription();
    const { getPreferredCurrency } = useCurrencies();

    const upsellRef = getUpsellRef({
        app: APP_UPSELL_REF_PATH.MAIL_UPSELL_REF_PATH,
        component: UPSELL_COMPONENT.MODAL,
        feature: MAIL_UPSELL_PATHS.ACCOUNT_LOCKED,
    });
    const upsellConfig = useUpsellConfig({
        upsellRef,
        planIDs: selectedPlan ? { [selectedPlan.Name]: 1 } : undefined,
        step: SUBSCRIPTION_STEPS.CHECKOUT,
        onSubscribed: () => {
            onSubscribed();
            rest.onClose?.();
        },
    });

    const handleUpgrade = () => {
        sendRequestUpsellModalReport({
            api,
            application: APPS.PROTONMAIL,
            sourceEvent: 'STATE_ACCOUNT_LOCKED',
            upsellModalType: UPSELL_MODALS_TYPE.OLD,
        });
        upsellConfig.onUpgrade?.();
    };

    const termsLink = <Href key="locale" href={getLocaleTermsURL(APP_NAME)}>{c('Link').t`terms of service`}</Href>;
    const contactLink = <Href key="contact" href={getAbuseURL()}>{c('Link').t`contact us`}</Href>;

    const canAccessDuoPlan = getCanSubscriptionAccessDuoPlan(subscription);
    const currency = getPreferredCurrency({
        user,
        status: paymentStatus,
        subscription,
        plans: plansResult?.plans,
    });
    const plansMap = getPlansMap(plansResult?.plans ?? [], currency);
    const planOptions = [
        plansMap[PLANS.MAIL],
        plansMap[PLANS.BUNDLE],
        canAccessDuoPlan ? plansMap[PLANS.DUO] : null,
        plansMap[PLANS.FAMILY],
    ]
        .map((plan) => {
            if (!plan) {
                return null;
            }
            const price = getPrice(plan, cycle, plansMap);
            if (!price) {
                return null;
            }
            return {
                plan,
                price,
            };
        })
        .filter(isTruthy);

    useEffect(() => {
        if (selectedPlan === undefined && planOptions.length) {
            setSelectedPlan(planOptions[0].plan);
        }
    }, [selectedPlan === undefined, planOptions.length]);

    return (
        <ModalTwo {...rest}>
            <ModalTwoHeader hasClose={false} />
            <ModalTwoContent className="mb-8">
                <div>
                    <div className="text-center">
                        <div className="mb-4">
                            <img
                                src={accountLockedImage}
                                className="block mx-auto w-custom"
                                style={{ '--w-custom': '6rem' }}
                                alt=""
                            />
                        </div>
                        <h1 className="h3 text-bold mb-4">
                            {c('Title').t`Account locked`}
                            <div className="text-sm mt-1">
                                {c('Info')
                                    .jt`We detected the creation of multiple free accounts, which violates our ${termsLink}.`}
                            </div>
                        </h1>
                        <div className="mb-4">
                            {c('Info')
                                .t`We have plans designed specifically for users like you who need more than one email address.
                            To remove restrictions, you can upgrade to a paid plan.`}
                        </div>
                        <div className="py-2">
                            <PlanSelect
                                loading={planResultLoading}
                                currency={currency}
                                options={planOptions}
                                value={selectedPlan}
                                onChange={(plan) => setSelectedPlan(plan)}
                            />
                        </div>
                    </div>
                    {features.length && (
                        <>
                            <div className="pt-4">
                                <UpsellFeatureList
                                    className={'mb-4'}
                                    features={features}
                                    iconSize={5}
                                    plan={selectedPlan}
                                    odd={true}
                                />
                            </div>
                            <ButtonLike
                                as={upsellConfig.upgradePath ? SettingsLink : undefined}
                                path={upsellConfig.upgradePath || ''}
                                onClick={handleUpgrade}
                                color="norm"
                                size="large"
                                shape="solid"
                                disabled={!selectedPlan}
                                fullWidth
                                className="mt-2"
                            >
                                {selectedPlan
                                    ? c('new_plans: Action').t`Get ${selectedPlan.Title}`
                                    : c('new_plans: Action').t`Get plan`}
                            </ButtonLike>
                            <div className="mt-4 color-weak text-center">
                                {c('Info').jt`If you believe we made a mistake, please ${contactLink}.`}
                            </div>
                        </>
                    )}
                </div>
            </ModalTwoContent>
        </ModalTwo>
    );
};

export default AccountLockedUpsellModal;
