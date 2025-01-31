import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { usePaymentStatus } from '@proton/account/paymentStatus/hooks';
import { usePlans } from '@proton/account/plans/hooks';
import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import ModalTwo, { type ModalProps } from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import Option from '@proton/components/components/option/Option';
import Price from '@proton/components/components/price/Price';
import SelectTwo from '@proton/components/components/selectTwo/SelectTwo';
import useUpsellConfig from '@proton/components/components/upsell/useUpsellConfig';
import { getPrice } from '@proton/components/containers/payments/subscription/PlanSelection';
import { SUBSCRIPTION_STEPS } from '@proton/components/containers/payments/subscription/constants';
import useApi from '@proton/components/hooks/useApi';
import { useCurrencies } from '@proton/components/payments/client-extensions';
import type { Currency } from '@proton/payments';
import { CYCLE, PLANS, getPlansMap } from '@proton/payments';
import { APPS, APP_UPSELL_REF_PATH, MAIL_UPSELL_PATHS, UPSELL_COMPONENT } from '@proton/shared/lib/constants';
import { getCanSubscriptionAccessDuoPlan } from '@proton/shared/lib/helpers/subscription';
import { UPSELL_MODALS_TYPE, getUpsellRef, sendRequestUpsellModalReport } from '@proton/shared/lib/helpers/upsell';
import type { Plan } from '@proton/shared/lib/interfaces';
import isTruthy from '@proton/utils/isTruthy';

import AccountLockedUpsellForm from './AccountLockedUpsellForm';

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

const AccountLockedUpsellModal = ({ onSubscribed, ...rest }: AccountLockedUpsellModalProps) => {
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
        plan: selectedPlan ? selectedPlan.Name : undefined,
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
                <AccountLockedUpsellForm
                    selectedPlan={selectedPlan}
                    handleUpgrade={handleUpgrade}
                    upsellConfig={upsellConfig}
                    renderPlanSelect={() => (
                        <PlanSelect
                            loading={planResultLoading}
                            currency={currency}
                            options={planOptions}
                            value={selectedPlan}
                            onChange={(plan) => setSelectedPlan(plan)}
                        />
                    )}
                />
            </ModalTwoContent>
        </ModalTwo>
    );
};

export default AccountLockedUpsellModal;
