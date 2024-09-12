import type { ReactNode } from 'react';
import { createContext, useContext, useRef } from 'react';

import { BilledUserModal } from '@proton/components/payments/client-extensions/billed-user';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { invokeInboxDesktopIPC } from '@proton/shared/lib/desktop/ipcHelpers';
import { isManagedExternally } from '@proton/shared/lib/helpers/subscription';
import type { Nullable } from '@proton/shared/lib/interfaces';
import { isBilledUser } from '@proton/shared/lib/interfaces';
import { FREE_PLAN } from '@proton/shared/lib/subscription/freePlans';
import clsx from '@proton/utils/clsx';
import noop from '@proton/utils/noop';

import { ModalTwo, ModalTwoContent, ModalTwoFooter, ModalTwoHeader, useModalState } from '../../../components';
import { useOrganization, usePaymentStatus, usePlans, useSubscription, useUser } from '../../../hooks';
import { useHasInboxDesktopInAppPayments } from '../../desktop/useHasInboxDesktopInAppPayments';
import { useRedirectToAccountApp } from '../../desktop/useRedirectToAccountApp';
import InAppPurchaseModal from './InAppPurchaseModal';
import type { SubscriptionContainerProps } from './SubscriptionContainer';
import SubscriptionContainer from './SubscriptionContainer';
import { SUBSCRIPTION_STEPS, subscriptionModalClassName } from './constants';

export interface OpenCallbackProps
    extends Pick<
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

export type OpenSubscriptionModalCallback = (props: OpenCallbackProps) => void;

type ContextProps = [OpenSubscriptionModalCallback, boolean];

const SubscriptionModalContext = createContext<ContextProps>([noop, false]);

export const useSubscriptionModal = () => {
    return useContext(SubscriptionModalContext);
};

interface Props {
    children: ReactNode;
    app: APP_NAMES;
    onClose?: () => void;
}

const SubscriptionModalProvider = ({ children, app, onClose }: Props) => {
    const [subscription, loadingSubscription] = useSubscription();
    const [plansResult, loadingPlans] = usePlans();
    const plans = plansResult?.plans || [];
    const freePlan = plansResult?.freePlan || FREE_PLAN;
    const [organization, loadingOrganization] = useOrganization();
    const redirectToAccountApp = useRedirectToAccountApp();
    const hasInboxDesktopInAppPayments = useHasInboxDesktopInAppPayments();
    const [user] = useUser();

    const [status, statusLoading] = usePaymentStatus();

    const loading = loadingSubscription || loadingPlans || loadingOrganization || statusLoading;

    const subscriptionProps = useRef<OpenCallbackProps | null>(null);
    const [modalState, setModalState, render] = useModalState();

    let subscriptionModal: Nullable<JSX.Element> = null;
    if (organization && subscription && render && subscriptionProps.current && status) {
        if (isManagedExternally(subscription)) {
            subscriptionModal = <InAppPurchaseModal subscription={subscription} {...modalState} />;
        } else if (isBilledUser(user)) {
            subscriptionModal = <BilledUserModal user={user} {...modalState} />;
        } else {
            const {
                hasClose,
                onClose: subscriptionPropsOnClose,
                disableCloseOnEscape,
                fullscreen,
                onSubscribed,
                onUnsubscribed,
                mode,
                currency,
                ...rest
            } = subscriptionProps.current;

            if (hasInboxDesktopInAppPayments) {
                invokeInboxDesktopIPC({ type: 'subscriptionModalOpened', payload: 'subscriptionModalStarted' });
            }

            const handleClose = () => {
                if (hasInboxDesktopInAppPayments) {
                    invokeInboxDesktopIPC({ type: 'subscriptionModalOpened', payload: 'subscriptionModalFinished' });
                }

                onClose?.();
                subscriptionPropsOnClose?.();
                modalState.onClose();
            };

            subscriptionModal = (
                <SubscriptionContainer
                    parent="subscription-modal"
                    app={app}
                    subscription={subscription}
                    plans={plans}
                    freePlan={freePlan}
                    organization={organization}
                    onSubscribed={() => {
                        handleClose();
                        onSubscribed?.();
                    }}
                    onUnsubscribed={() => {
                        handleClose();
                        onUnsubscribed?.();
                    }}
                    onCancel={handleClose}
                    mode={mode}
                    currency={currency}
                    paymentsStatus={status}
                    {...rest}
                    render={({ onSubmit, title, content, footer, step }) => {
                        return (
                            <ModalTwo
                                className={clsx([
                                    subscriptionModalClassName,
                                    [SUBSCRIPTION_STEPS.PLAN_SELECTION, SUBSCRIPTION_STEPS.CHECKOUT].includes(step) &&
                                        'subscription-modal--fixed-height',
                                    [SUBSCRIPTION_STEPS.PLAN_SELECTION].includes(step) &&
                                        'subscription-modal--large-width',
                                    [SUBSCRIPTION_STEPS.CHECKOUT].includes(step) && 'subscription-modal--medium-width',
                                ])}
                                data-testid="plansModal"
                                {...modalState}
                                onClose={handleClose}
                                disableCloseOnEscape={disableCloseOnEscape}
                                fullscreen={fullscreen}
                                as="form"
                                size="large"
                                onSubmit={onSubmit}
                            >
                                <ModalTwoHeader title={title} hasClose={hasClose} />
                                <ModalTwoContent>{content}</ModalTwoContent>
                                {footer && <ModalTwoFooter>{footer}</ModalTwoFooter>}
                            </ModalTwo>
                        );
                    }}
                />
            );
        }
    }

    return (
        <>
            {subscriptionModal}
            <SubscriptionModalContext.Provider
                value={[
                    (props) => {
                        if (redirectToAccountApp()) {
                            return;
                        }

                        if (loading || render) {
                            return;
                        }

                        subscriptionProps.current = props;
                        setModalState(true);
                    },
                    loading,
                ]}
            >
                {children}
            </SubscriptionModalContext.Provider>
        </>
    );
};

export default SubscriptionModalProvider;
