import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useRef, useState } from 'react';

import type { APP_NAMES } from '@proton/shared/lib/constants';
import noop from '@proton/utils/noop';

import { useRedirectToAccountApp } from '../../desktop/useRedirectToAccountApp';
import type { SubscriptionContainerProps } from './SubscriptionContainer';
import type { SubscriptionModalFowardedRefProps } from './SubscriptionModal';
import SubscriptionModal from './SubscriptionModal';
import { type SUBSCRIPTION_STEPS } from './constants';

export type SubscriptionOverridableStep = SUBSCRIPTION_STEPS.UPGRADE | SUBSCRIPTION_STEPS.THANKS;

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
    const redirectToAccountApp = useRedirectToAccountApp();
    const [modalDepsLoading, setModalDepsLoading] = useState(true);
    const subscriptionModalRef = useRef<SubscriptionModalFowardedRefProps>(null);

    const handleDepsLoaded = useCallback(() => {
        setModalDepsLoading(false);
    }, []);

    return (
        <>
            <SubscriptionModal ref={subscriptionModalRef} onClose={onClose} app={app} onDepsLoaded={handleDepsLoaded} />
            <SubscriptionModalContext.Provider
                value={[
                    (props) => {
                        if (redirectToAccountApp()) {
                            return;
                        }

                        if (modalDepsLoading || subscriptionModalRef.current?.isOpened) {
                            return;
                        }

                        subscriptionModalRef.current?.open(props);
                    },
                    modalDepsLoading,
                ]}
            >
                {children}
            </SubscriptionModalContext.Provider>
        </>
    );
};

export default SubscriptionModalProvider;
