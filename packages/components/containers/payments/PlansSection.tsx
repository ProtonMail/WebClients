import React, { useState, useEffect } from 'react';
import { c } from 'ttag';

import { checkSubscription, deleteSubscription } from 'proton-shared/lib/api/payments';
import { DEFAULT_CURRENCY, DEFAULT_CYCLE, PLAN_SERVICES, APPS } from 'proton-shared/lib/constants';
import { getPlanIDs } from 'proton-shared/lib/helpers/subscription';
import { hasBonuses } from 'proton-shared/lib/helpers/organization';
import { Currency, Organization, PlanIDs, Subscription, SubscriptionCheckResponse } from 'proton-shared/lib/interfaces';
import { hasPlanIDs } from 'proton-shared/lib/helpers/planIDs';

import { Button, Loader } from '../../components';
import {
    useSubscription,
    useOrganization,
    usePlans,
    useApi,
    useUser,
    useModals,
    useEventManager,
    useNotifications,
    useConfig,
    useLoading,
} from '../../hooks';

import SubscriptionModal from './subscription/SubscriptionModal';
import DowngradeModal from './DowngradeModal';
import LossLoyaltyModal from './LossLoyaltyModal';
import MozillaInfoPanel from '../account/MozillaInfoPanel';
import { SUBSCRIPTION_STEPS } from './subscription/constants';
import PlanSelection from './subscription/PlanSelection';

const FREE_SUBSCRIPTION = {} as Subscription;
const FREE_ORGANIZATION = {} as Organization;

const PlansSection = () => {
    const { call } = useEventManager();
    const { APP_NAME } = useConfig();
    const { createNotification } = useNotifications();
    const { createModal } = useModals();
    const [user] = useUser();
    const [loading, withLoading] = useLoading();
    const [subscription = FREE_SUBSCRIPTION, loadingSubscription] = useSubscription();
    const [organization = FREE_ORGANIZATION, loadingOrganization] = useOrganization();
    const [plans = [], loadingPlans] = usePlans();
    const api = useApi();
    const isVPN = APP_NAME === APPS.PROTONVPN_SETTINGS;

    const service = isVPN ? PLAN_SERVICES.VPN : PLAN_SERVICES.MAIL;
    const currentPlanIDs = getPlanIDs(subscription);

    const [currency, setCurrency] = useState<Currency>(DEFAULT_CURRENCY);
    const [cycle, setCycle] = useState(DEFAULT_CYCLE);
    const { CouponCode } = subscription;

    const handleUnsubscribe = async () => {
        await api(deleteSubscription());
        await call();
        createNotification({ text: c('Success').t`You have successfully unsubscribed` });
    };

    const handleDowngrade = async () => {
        if (user.isFree) {
            return createNotification({ type: 'error', text: c('Info').t`You already have a free account` });
        }
        await new Promise<void>((resolve, reject) => {
            createModal(<DowngradeModal user={user} onConfirm={resolve} onClose={reject} />);
        });
        if (hasBonuses(organization)) {
            await new Promise<void>((resolve, reject) => {
                createModal(<LossLoyaltyModal organization={organization} onConfirm={resolve} onClose={reject} />);
            });
        }
        return handleUnsubscribe();
    };

    const handleModal = async (newPlanIDs: PlanIDs) => {
        if (!hasPlanIDs(newPlanIDs)) {
            handleDowngrade();
            return;
        }

        const couponCode = CouponCode || undefined; // From current subscription; CouponCode can be null
        const { Coupon } = await api<SubscriptionCheckResponse>(
            checkSubscription({
                PlanIDs: newPlanIDs,
                Currency: currency,
                Cycle: cycle,
                CouponCode: couponCode,
            })
        );

        const coupon = Coupon ? Coupon.Code : undefined; // Coupon can equals null

        createModal(
            <SubscriptionModal
                planIDs={newPlanIDs}
                coupon={coupon}
                currency={currency}
                cycle={cycle}
                step={SUBSCRIPTION_STEPS.CUSTOMIZATION}
            />
        );
    };

    useEffect(() => {
        if (loadingPlans || loadingSubscription) {
            return;
        }
        const [{ Currency } = { Currency: undefined }] = plans;
        setCurrency(subscription.Currency || Currency);
        setCycle(subscription.Cycle || DEFAULT_CYCLE);
    }, [loadingSubscription, loadingPlans]);

    // @ts-ignore
    if (subscription.isManagedByMozilla) {
        return <MozillaInfoPanel />;
    }

    if (loadingSubscription || loadingPlans || loadingOrganization) {
        return <Loader />;
    }

    return (
        <>
            <PlanSelection
                loading={loading}
                plans={plans}
                currency={currency}
                cycle={cycle}
                planIDs={currentPlanIDs}
                hasFreePlan={false}
                hasPlanSelectionComparison={false}
                organization={organization}
                subscription={subscription}
                service={service}
                onChangePlanIDs={(planIDs) => {
                    withLoading(handleModal(planIDs));
                }}
                onChangeCurrency={setCurrency}
                onChangeCycle={setCycle}
            />
            <p className="text-sm">{c('Info').t`* Customizable features`}</p>
            <Button
                color="norm"
                shape="ghost"
                className="flex center mb1"
                onClick={() => {
                    createModal(
                        <SubscriptionModal
                            planIDs={currentPlanIDs}
                            coupon={CouponCode}
                            currency={currency}
                            cycle={cycle}
                            step={SUBSCRIPTION_STEPS.PLAN_SELECTION}
                        />
                    );
                }}
            >
                {c('Action').t`Compare plans`}
            </Button>
        </>
    );
};

export default PlansSection;
