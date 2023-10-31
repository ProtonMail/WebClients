import { ReactNode, createContext, useContext, useRef } from 'react';

import { APP_NAMES } from '@proton/shared/lib/constants';
import { getHasLegacyPlans, isManagedExternally } from '@proton/shared/lib/helpers/subscription';
import { Nullable } from '@proton/shared/lib/interfaces';
import clsx from '@proton/utils/clsx';
import noop from '@proton/utils/noop';

import { ModalTwo, ModalTwoContent, ModalTwoFooter, ModalTwoHeader, useModalState } from '../../../components';
import { useOrganization, usePlans, useSubscription } from '../../../hooks';
import InAppPurchaseModal from './InAppPurchaseModal';
import SubscriptionContainer, { SubscriptionContainerProps } from './SubscriptionContainer';
import SubscriptionModalDisabled from './SubscriptionModalDisabled';
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
    > {
    hasClose?: boolean;
    onClose?: () => void;
    disableCloseOnEscape?: boolean;
    fullscreen?: boolean;
    onSubscribed?: () => void;
    onUnsubscribed?: () => void;
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
    const [plans = [], loadingPlans] = usePlans();
    const [organization, loadingOrganization] = useOrganization();

    const loading = loadingSubscription || loadingPlans || loadingOrganization;

    const subscriptionProps = useRef<OpenCallbackProps | null>(null);
    const [modalState, setModalState, render] = useModalState();

    let subscriptionModal: Nullable<JSX.Element> = null;
    if (render && subscriptionProps.current) {
        if (isManagedExternally(subscription)) {
            subscriptionModal = <InAppPurchaseModal subscription={subscription} {...modalState} />;
        } else if (getHasLegacyPlans(subscription)) {
            subscriptionModal = <SubscriptionModalDisabled {...modalState} />;
        } else {
            const {
                hasClose,
                onClose: subscriptionPropsOnClose,
                disableCloseOnEscape,
                fullscreen,
                onSubscribed,
                onUnsubscribed,
                ...rest
            } = subscriptionProps.current;
            const handleClose = () => {
                onClose?.();
                subscriptionPropsOnClose?.();
                modalState.onClose();
            };

            subscriptionModal = (
                <SubscriptionContainer
                    app={app}
                    subscription={subscription}
                    plans={plans}
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
                    {...rest}
                    render={({ onSubmit, title, content, footer, step }) => {
                        return (
                            <ModalTwo
                                className={clsx([
                                    subscriptionModalClassName,
                                    [
                                        SUBSCRIPTION_STEPS.PLAN_SELECTION,
                                        SUBSCRIPTION_STEPS.CUSTOMIZATION,
                                        SUBSCRIPTION_STEPS.CHECKOUT,
                                        SUBSCRIPTION_STEPS.CHECKOUT_WITH_CUSTOMIZATION,
                                    ].includes(step) && 'subscription-modal--fixed-height',
                                    [SUBSCRIPTION_STEPS.PLAN_SELECTION].includes(step) &&
                                        'subscription-modal--large-width',
                                    [
                                        SUBSCRIPTION_STEPS.CUSTOMIZATION,
                                        SUBSCRIPTION_STEPS.CHECKOUT,
                                        SUBSCRIPTION_STEPS.CHECKOUT_WITH_CUSTOMIZATION,
                                    ].includes(step) && 'subscription-modal--medium-width',
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
