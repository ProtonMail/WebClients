import React from 'react';
import { hasMailPlus, getPlanIDs } from '@proton/shared/lib/helpers/subscription';
import { switchPlan } from '@proton/shared/lib/helpers/planIDs';
import { DEFAULT_CURRENCY, DEFAULT_CYCLE, PLAN_SERVICES, PLANS } from '@proton/shared/lib/constants';
import { toMap } from '@proton/shared/lib/helpers/object';
import { c } from 'ttag';
import { Loader, Button, Card } from '../../../components';
import { useUser, useSubscription, useModals, usePlans, useAddresses, useOrganization } from '../../../hooks';

import SubscriptionModal from './SubscriptionModal';
import { SUBSCRIPTION_STEPS } from './constants';
import UpsellItem from './UpsellItem';

const UpsellMailTemplate = ({ children }: { children: React.ReactNode }) => (
    <Card rounded bordered={false} className="mt1-5">
        <UpsellItem icon="organization-users">{c('Mail upsell feature').t`Get Multi-user support`}</UpsellItem>
        <UpsellItem icon="organization">{c('Mail upsell feature').t`Host emails for your organization`}</UpsellItem>
        <UpsellItem icon="keys">{c('Mail upsell feature').t`Create separate logins for each user`}</UpsellItem>
        {children}
    </Card>
);

const UpsellMailSubscription = () => {
    const [{ hasPaidMail }, loadingUser] = useUser();
    const [subscription, loadingSubscription] = useSubscription();
    const [organization, loadingOrganization] = useOrganization();
    const [plans = [], loadingPlans] = usePlans();
    const { Currency = DEFAULT_CURRENCY, Cycle = DEFAULT_CYCLE } = subscription || {};
    const isFreeMail = !hasPaidMail;
    const { createModal } = useModals();
    const [addresses, loadingAddresses] = useAddresses();
    const hasAddresses = Array.isArray(addresses) && addresses.length > 0;
    const plansMap = toMap(plans, 'Name');
    const planIDs = getPlanIDs(subscription);

    const handleUpgradeClick = (plan: PLANS) => () => {
        createModal(
            <SubscriptionModal
                currency={Currency}
                cycle={Cycle}
                planIDs={switchPlan({
                    planIDs,
                    plans,
                    planID: plansMap[plan].ID,
                    service: PLAN_SERVICES.MAIL,
                    organization,
                })}
                step={SUBSCRIPTION_STEPS.CUSTOMIZATION}
            />
        );
    };

    if (loadingUser || loadingSubscription || loadingPlans || loadingAddresses || loadingOrganization) {
        return <Loader />;
    }

    if (isFreeMail && hasAddresses) {
        return (
            <UpsellMailTemplate>
                <Button color="norm" className="mt1" onClick={handleUpgradeClick(PLANS.PLUS)}>
                    {c('Action').t`Upgrade to Plus`}
                </Button>
            </UpsellMailTemplate>
        );
    }

    if (hasMailPlus(subscription) && hasAddresses) {
        return (
            <UpsellMailTemplate>
                <Button color="norm" className="mt1" onClick={handleUpgradeClick(PLANS.PROFESSIONAL)}>
                    {c('Action').t`Upgrade to Professional`}
                </Button>
            </UpsellMailTemplate>
        );
    }

    return null;
};

export default UpsellMailSubscription;
