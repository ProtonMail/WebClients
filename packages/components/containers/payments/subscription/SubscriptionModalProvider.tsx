import type { ReactNode } from 'react';
import { createContext, useContext, useRef, useState } from 'react';

import { c } from 'ttag';

import { useGetOrganization } from '@proton/account/organization/hooks';
import { useGetPaymentStatus } from '@proton/account/paymentStatus/hooks';
import { useGetPlans } from '@proton/account/plans/hooks';
import { useGetSubscription } from '@proton/account/subscription/hooks';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import useNotifications from '@proton/components/hooks/useNotifications';
import { usePaymentsApi } from '@proton/components/payments/react-extensions/usePaymentsApi';
import useLoading from '@proton/hooks/useLoading';
import type { BillingAddressExtended } from '@proton/payments/core/billing-address/billing-address';
import {
    type FreePlanDefault,
    type FreeSubscription,
    type PaymentStatus,
    type Plan,
    type Subscription,
    fixPlanIDs,
    fixPlanName,
} from '@proton/payments/index';
import { tracePaymentError } from '@proton/payments/sentry/capture';
import { loadInitialBillingAddress } from '@proton/payments/ui/helpers/load-initial-billing-address';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import type { Organization } from '@proton/shared/lib/interfaces';

import { useRedirectToAccountApp } from '../../desktop/useRedirectToAccountApp';
import type { SubscriptionContainerProps } from './SubscriptionContainer';
import SubscriptionModal from './SubscriptionModal';
import type { SUBSCRIPTION_STEPS } from './constants';

export type SubscriptionOverridableStep = SUBSCRIPTION_STEPS.UPGRADE | SUBSCRIPTION_STEPS.THANKS;

export interface OpenCallbackProps extends Pick<
    SubscriptionContainerProps,
    | 'step'
    | 'cycle'
    | 'currency'
    | 'plan'
    | 'planIDs'
    | 'coupon'
    | 'disablePlanSelection'
    | 'disableThanksStep'
    | 'defaultAudience'
    | 'disableCycleSelector'
    | 'defaultSelectedProductPlans'
    | 'metrics'
    | 'telemetryFlow'
    | 'upsellRef'
    | 'maximumCycle'
    | 'minimumCycle'
    | 'onSubscribed'
    | 'onUnsubscribed'
    | 'mode'
    | 'allowedAddonTypes'
> {
    hasClose?: boolean;
    onClose?: () => void;
    disableCloseOnEscape?: boolean;
    fullscreen?: boolean;
}

/** Resolves after subscription data is loaded and the modal is opened (or after an early exit e.g. redirect). */
export type OpenSubscriptionModalCallback = (props: OpenCallbackProps) => Promise<void>;

const defaultOpenSubscriptionModal: OpenSubscriptionModalCallback = () => Promise.resolve();

/**
 * [openSubscriptionModal, loadingData, isSubscriptionModalAvailable]
 * — third entry is `false` when no `SubscriptionModalProvider` ancestor (React default context).
 */
export type SubscriptionModalContextValue = readonly [
    OpenSubscriptionModalCallback,
    boolean,
    isSubscriptionModalAvailable: boolean,
];

const SubscriptionModalContext = createContext<SubscriptionModalContextValue>([
    defaultOpenSubscriptionModal,
    false,
    false,
]);

export const useSubscriptionModal = () => {
    return useContext(SubscriptionModalContext);
};

/**
 * Like {@link useSubscriptionModal}, but for trees that may render without `SubscriptionModalProvider`.
 *
 * Returns `[open, loading]` where `open` is `undefined` when no provider is mounted (React default context). In that
 * case `loading` is always `false`. Under a provider, `open` is the real callback and `loading` matches preload / open
 * state.
 *
 * Prefer {@link useSubscriptionModal} when the component is always wrapped by `SubscriptionModalProvider`, so
 * callers keep a non-optional `open` function.
 */
export const useOptionalSubscriptionModal = (): [OpenSubscriptionModalCallback | undefined, boolean] => {
    const [openSubscriptionModal, loadingData, isSubscriptionModalAvailable] = useSubscriptionModal();
    if (!isSubscriptionModalAvailable) {
        return [undefined, false];
    }
    return [openSubscriptionModal, loadingData];
};

/**
 * Escape hatch for {@link useSubscriptionModal} that returns only the `open` callback and skips the
 * `loading` value. The `custom-rules/use-subscription-modal-loading` lint rule requires callers of
 * `useSubscriptionModal` to destructure the loading flag; switch to this variant when you intentionally
 * want to ignore it and handle the promise returned by `openSubscriptionModal()` yourself.
 */
export const useSubscriptionModalRaw = () => {
    // eslint-disable-next-line custom-rules/use-subscription-modal-loading
    const [openSubscriptionModal] = useSubscriptionModal();
    return openSubscriptionModal;
};

/**
 * Escape hatch for {@link useOptionalSubscriptionModal} that returns only the `open` callback and skips the
 * `loading` value. The `custom-rules/use-subscription-modal-loading` lint rule requires callers of
 * `useOptionalSubscriptionModal` to destructure the loading flag; switch to this variant when you intentionally
 * want to ignore it and handle the promise returned by `openSubscriptionModal()` yourself.
 */
export const useOptionalSubscriptionModalRaw = () => {
    // eslint-disable-next-line custom-rules/use-subscription-modal-loading
    const [openSubscriptionModal] = useOptionalSubscriptionModal();
    return openSubscriptionModal;
};

interface Props {
    children: ReactNode;
    app: APP_NAMES;
    onClose?: () => void;
}

const SubscriptionModalProvider = ({ children, app, onClose }: Props) => {
    const redirectToAccountApp = useRedirectToAccountApp();

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
                tags: {
                    component: 'SubscriptionModalProvider',
                },
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
