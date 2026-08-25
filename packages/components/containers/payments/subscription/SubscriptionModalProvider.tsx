import type { ReactNode } from 'react';
import { useCallback, useRef, useState } from 'react';

import { c } from 'ttag';

import { useGetOrganization } from '@proton/account/organization/hooks';
import { useGetPaymentStatus } from '@proton/account/paymentStatus/hooks';
import { useGetPlans } from '@proton/account/plans/hooks';
import { useGetSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import { useConfig } from '@proton/app-context/useConfig';
import { useNotifications } from '@proton/app-context/useNotifications';
import useLoading from '@proton/hooks/useLoading';
import type { BillingAddressExtended } from '@proton/payments/core/billing-address/billing-address';
import { fixPlanIDs, fixPlanName } from '@proton/payments/core/helpers';
import type { FreeSubscription, PaymentStatus } from '@proton/payments/core/interface';
import type { FreePlanDefault, Plan } from '@proton/payments/core/plan/interface';
import type { Subscription } from '@proton/payments/core/subscription/interface';
import { tracePaymentError } from '@proton/payments/sentry/capture';
import type { UpsellTelemetryContext } from '@proton/payments/telemetry/shared-checkout-telemetry';
import { checkoutTelemetry } from '@proton/payments/telemetry/telemetry';
import { loadInitialBillingAddress } from '@proton/payments/ui/helpers/load-initial-billing-address';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import type { Organization } from '@proton/shared/lib/interfaces';

import useModalState from '../../../components/modalTwo/useModalState';
import { usePaymentsApi } from '../../../payments/react-extensions/usePaymentsApi';
import { useRedirectToAccountApp } from '../../desktop/useRedirectToAccountApp';
import SubscriptionModal from './SubscriptionModal';
import {
    SubscriptionModalContext,
    useOptionalSubscriptionModal,
    useOptionalSubscriptionModalRaw,
    useSubscriptionModal,
    useSubscriptionModalRaw,
} from './subscriptionModalContext';
import type { OpenSubscriptionModalCallback } from './subscriptionModalContext';
import type { OpenCallbackProps, SubscriptionOverridableStep } from './subscriptionModalTypes';

export type { OpenCallbackProps, OpenSubscriptionModalCallback, SubscriptionOverridableStep };
export {
    SubscriptionModalContext,
    useOptionalSubscriptionModal,
    useOptionalSubscriptionModalRaw,
    useSubscriptionModal,
    useSubscriptionModalRaw,
};

interface Props {
    children: ReactNode;
    app: APP_NAMES;
    onClose?: () => void;
}

const SubscriptionModalProvider = ({ children, app, onClose }: Props) => {
    const redirectToAccountApp = useRedirectToAccountApp();

    const [user] = useUser();
    const { APP_NAME } = useConfig();

    const { paymentsApi } = usePaymentsApi();
    const { createNotification } = useNotifications();

    const getSubscription = useGetSubscription();
    const [subscription, setSubscription] = useState<Subscription | FreeSubscription | undefined>();

    const getPlans = useGetPlans();
    const [plans, setPlans] = useState<Plan[] | undefined>();
    const [freePlan, setFreePlan] = useState<FreePlanDefault | undefined>();

    const getPaymentStatus = useGetPaymentStatus();
    const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | undefined>();
    const [initialBillingAddress, setInitialBillingAddress] = useState<BillingAddressExtended | undefined>();

    const getOrganization = useGetOrganization();
    const [organization, setOrganization] = useState<Organization | undefined>();

    const [modalState, setModalState, renderSubscriptionModal] = useModalState();
    const subscriptionPropsRef = useRef<OpenCallbackProps | null>(null);

    const [loadingData, withLoadingData] = useLoading();

    const preloadSubscriptionModalData = async () => {
        const [
            newSubscription,
            newPlansResult,
            newOrganization,
            { billingAddress: loadedBillingAddress, paymentStatus: loadedPaymentStatus },
        ] = await Promise.all([
            getSubscription(),
            getPlans(),
            getOrganization(),
            loadInitialBillingAddress({
                getPaymentStatus,
                getFullBillingAddress: paymentsApi.getFullBillingAddress,
                isAuthenticated: true,
            }),
        ]);

        setSubscription(newSubscription);
        setPlans(newPlansResult.plans);
        setFreePlan(newPlansResult.freePlan);
        setPaymentStatus(loadedPaymentStatus);
        setOrganization(newOrganization);
        setInitialBillingAddress(loadedBillingAddress);
    };

    const openSubscriptionModal = async (subscriptionModalProps: OpenCallbackProps) => {
        if (
            redirectToAccountApp({
                app: app,
                ...subscriptionModalProps,
            })
        ) {
            return;
        }

        if (modalState.open) {
            return;
        }

        try {
            await withLoadingData(preloadSubscriptionModalData());
        } catch (error) {
            tracePaymentError(error, {
                component: 'subscription-modal-provider',
                subscription,
                extra: {
                    ...subscriptionModalProps,
                },
            });
            createNotification({
                type: 'error',
                text: c('Error').t`Failed to load subscription data. Please try again later.`,
            });
            return;
        }

        const fixedPlanName = fixPlanName(subscriptionModalProps.plan, 'OpenSubscriptionModal');
        const fixedPlanIDs = fixPlanIDs(subscriptionModalProps.planIDs, 'OpenSubscriptionModal');

        subscriptionPropsRef.current = {
            ...subscriptionModalProps,
            plan: fixedPlanName,
            planIDs: fixedPlanIDs,
        };

        setModalState(true);

        subscriptionModalProps.onMount?.();

        if (subscriptionModalProps.upsellTelemetryContext) {
            checkoutTelemetry.reportUpsellModalOpen({
                context: subscriptionModalProps.upsellTelemetryContext,
                userCurrency: user?.Currency,
                subscription,
                selectedPlanIDs: subscriptionModalProps.planIDs,
                build: APP_NAME,
                product: app,
            });
        }
    };

    const handleClose = () => {
        onClose?.();
        subscriptionPropsRef.current = null;
    };

    return (
        <>
            {renderSubscriptionModal &&
                subscription &&
                initialBillingAddress &&
                plans &&
                freePlan &&
                organization &&
                paymentStatus &&
                subscriptionPropsRef.current && (
                    <SubscriptionModal
                        onClose={handleClose}
                        app={app}
                        modalState={modalState}
                        subscription={subscription}
                        initialBillingAddress={initialBillingAddress}
                        plans={plans}
                        freePlan={freePlan}
                        organization={organization}
                        paymentStatus={paymentStatus}
                        subscriptionProps={subscriptionPropsRef.current}
                    />
                )}
            <SubscriptionModalContext.Provider value={[openSubscriptionModal, loadingData, true]}>
                {children}
            </SubscriptionModalContext.Provider>
        </>
    );
};

export default SubscriptionModalProvider;

export const UpsellModalTelemetryProvider = ({
    context,
    children,
}: {
    context: UpsellTelemetryContext;
    children: ReactNode;
}) => {
    const [open, loadingData, isSubscriptionModalAvailable] = useSubscriptionModal();

    const openCallback = useCallback<OpenSubscriptionModalCallback>(
        (props) => open({ ...props, upsellTelemetryContext: context }),
        [open, context]
    );

    return (
        <SubscriptionModalContext.Provider value={[openCallback, loadingData, isSubscriptionModalAvailable]}>
            {children}
        </SubscriptionModalContext.Provider>
    );
};
