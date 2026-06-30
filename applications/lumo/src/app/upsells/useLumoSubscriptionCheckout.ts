import { useCallback, useMemo } from 'react';

import { SUBSCRIPTION_STEPS, useSubscriptionModal } from '@proton/components';
import useConfig from '@proton/components/hooks/useConfig';
import { usePreferredPlansMap } from '@proton/components/hooks/usePreferredPlansMap';
import { CYCLE, PLANS } from '@proton/payments';
import type { UPSELL_FEATURE } from '@proton/shared/lib/constants';
import { UPSELL_COMPONENT } from '@proton/shared/lib/constants';
import { getUpsellRefFromApp } from '@proton/shared/lib/helpers/upsell';

import { LUMO_BUSINESS_PATH } from '../constants';
import { sendSubscriptionModalInitializedEvent, sendSubscriptionModalSubscribedEvent } from '../util/telemetry';
import { getMarketingUrl } from '../util/marketingUrls';

interface UseLumoSubscriptionCheckoutOptions {
    feature?: UPSELL_FEATURE;
    upsellRef?: string;
    onSubscribed?: () => void;
}

export const useLumoSubscriptionCheckout = ({
    feature,
    upsellRef: upsellRefOverride,
    onSubscribed,
}: UseLumoSubscriptionCheckoutOptions = {}) => {
    const { APP_NAME } = useConfig();
    const [openSubscriptionModal, loadingSubscriptionModal] = useSubscriptionModal();
    const { plansMap, plansMapLoading } = usePreferredPlansMap(true);

    const upsellRef = useMemo(() => {
        if (upsellRefOverride !== undefined) {
            return upsellRefOverride;
        }

        if (!feature) {
            return undefined;
        }

        return (
            getUpsellRefFromApp({
                app: APP_NAME,
                feature,
                component: UPSELL_COMPONENT.BUTTON,
            }) || undefined
        );
    }, [APP_NAME, feature, upsellRefOverride]);

    const openCheckout = useCallback(
        (plan: PLANS) => {
            sendSubscriptionModalInitializedEvent(upsellRef);

            void openSubscriptionModal({
                step: SUBSCRIPTION_STEPS.CHECKOUT,
                disablePlanSelection: true,
                maximumCycle: CYCLE.YEARLY,
                plan,
                onSubscribed: () => {
                    onSubscribed?.();
                    sendSubscriptionModalSubscribedEvent(upsellRef);
                },
                upsellRef,
            });
        },
        [onSubscribed, openSubscriptionModal, upsellRef]
    );

    const openPlusCheckout = useCallback(() => {
        openCheckout(PLANS.LUMO);
    }, [openCheckout]);

    const openBusinessCheckout = useCallback(() => {
        if (!plansMap[PLANS.LUMO_BUSINESS]) {
            window.location.assign(getMarketingUrl(LUMO_BUSINESS_PATH));
            return;
        }

        openCheckout(PLANS.LUMO_BUSINESS);
    }, [openCheckout, plansMap]);

    return {
        openCheckout,
        openPlusCheckout,
        openBusinessCheckout,
        loading: loadingSubscriptionModal,
        plansMapLoading,
    };
};
