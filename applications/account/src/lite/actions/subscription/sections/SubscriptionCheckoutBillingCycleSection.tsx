import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { useAppName } from '@proton/account/appName';
import SubscriptionCheckoutCycleItem from '@proton/components/containers/payments/subscription/cycle-selector/SubscriptionCheckoutCycleItem';
import SubscriptionCycleSelector from '@proton/components/containers/payments/subscription/cycle-selector/SubscriptionCycleSelector';
import { getAllowedCycles } from '@proton/components/containers/payments/subscription/helpers/getAllowedCycles';
import type { SubscriptionCheckResponse } from '@proton/payments';
import { PLANS, getIsCustomCycle } from '@proton/payments';
import { usePaymentsInner } from '@proton/payments/ui';

import { runAdditionalCycleChecks } from '../helpers';

interface Props {
    minimumCycle?: number;
}

const SubscriptionCheckoutBillingCycleSection = ({ minimumCycle }: Props) => {
    const {
        uiData,
        checkResult,
        plansMap,
        selectCycle,
        selectedPlan,
        subscription,
        checkMultiplePlans,
        loading,
        coupon,
        couponConfig,
    } = usePaymentsInner();
    const { checkout } = uiData;
    const { cycle, planIDs, currency } = checkout;
    const disableCycleSelector = getIsCustomCycle(cycle) || selectedPlan.name === PLANS.PASS_LIFETIME;
    const [additionalCheckResults, setAdditionalCheckResults] = useState<SubscriptionCheckResponse[]>([]);
    const appName = useAppName();

    const allowedCycles = getAllowedCycles({
        subscription,
        minimumCycle,
        currency,
        planIDs,
        plansMap,
        allowDowncycling: true,
        cycleParam: cycle,
        app: appName,
        couponConfig,
    });

    useEffect(() => {
        void (async () => {
            const additionalChecks = await runAdditionalCycleChecks(
                allowedCycles,
                checkResult,
                subscription,
                planIDs,
                plansMap,
                currency,
                coupon,
                checkMultiplePlans
            );
            setAdditionalCheckResults([...additionalChecks]);
        })();
    }, [planIDs, cycle, currency, coupon]);

    return (
        <>
            <h2 className="text-2xl text-bold mt-8 mb-4">{c('Label').t`Choose your billing`}</h2>
            {disableCycleSelector ? (
                <SubscriptionCheckoutCycleItem
                    checkResult={checkResult}
                    plansMap={plansMap}
                    planIDs={planIDs}
                    couponConfig={couponConfig}
                />
            ) : (
                <SubscriptionCycleSelector
                    mode="buttons"
                    plansMap={plansMap}
                    planIDs={planIDs}
                    cycle={cycle}
                    currency={currency}
                    onChangeCycle={(cycle) => selectCycle(cycle)}
                    faded={loading}
                    additionalCheckResults={[...additionalCheckResults, checkResult]}
                    allowedCycles={allowedCycles}
                    checkResult={checkResult}
                    listItemClassName="flex items-stretch mb-2"
                />
            )}
        </>
    );
};

export default SubscriptionCheckoutBillingCycleSection;
