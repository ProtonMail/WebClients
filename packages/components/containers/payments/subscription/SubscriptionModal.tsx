import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

import { useOrganization } from '@proton/account/organization/hooks';
import { usePaymentStatus } from '@proton/account/paymentStatus/hooks';
import { usePlans } from '@proton/account/plans/hooks';
import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import { useDrivePostSignupOneDollarTelemetry } from '@proton/components/components/topnavbar/TopNavbarPostSignupPromo/PostSignupOneDollar/DrivePostSignupOneDollar/useDrivePostSignupOneDollarTelemetry';
import { BilledUserModal } from '@proton/components/payments/client-extensions/billed-user';
import { COUPON_CODES } from '@proton/payments';
import { TelemetryMailDrivePostSignupOneDollar } from '@proton/shared/lib/api/telemetry';
import { APPS, type APP_NAMES } from '@proton/shared/lib/constants';
import { invokeInboxDesktopIPC } from '@proton/shared/lib/desktop/ipcHelpers';
import { getHas2024OfferCoupon, isManagedExternally } from '@proton/shared/lib/helpers/subscription';
import { isBilledUser } from '@proton/shared/lib/interfaces';
import { FREE_PLAN } from '@proton/shared/lib/subscription/freePlans';
import clsx from '@proton/utils/clsx';

import { useHasInboxDesktopInAppPayments } from '../../desktop/useHasInboxDesktopInAppPayments';
import InAppPurchaseModal from './InAppPurchaseModal';
import SubscriptionContainer from './SubscriptionContainer';
import type { OpenCallbackProps, SubscriptionOverridableStep } from './SubscriptionModalProvider';
import { SUBSCRIPTION_STEPS, subscriptionModalClassName } from './constants';
import { usePostSubscription } from './postSubscription/usePostSubscription';

interface Props {
    app: APP_NAMES;
    onClose?: () => void;
    onDepsLoaded: () => void;
}

export interface SubscriptionModalFowardedRefProps {
    isOpened: boolean;
    /** Opens the subscription modal */
    open: (subscriptionProps: OpenCallbackProps) => void;
}
const isOverridablableStep = (step: SUBSCRIPTION_STEPS): step is SubscriptionOverridableStep =>
    [SUBSCRIPTION_STEPS.UPGRADE, SUBSCRIPTION_STEPS.THANKS].includes(step);

const SubscriptionModal = forwardRef<SubscriptionModalFowardedRefProps, Props>(
    ({ app, onClose, onDepsLoaded }, ref) => {
        const [user] = useUser();
        const subscriptionPropsRef = useRef<OpenCallbackProps | null>(null);
        const [subscription, loadingSubscription] = useSubscription();
        const postSubscriptionProps = usePostSubscription();
        const [plansResult, loadingPlans] = usePlans();
        const plans = plansResult?.plans || [];
        const freePlan = plansResult?.freePlan || FREE_PLAN;
        const [status, statusLoading] = usePaymentStatus();
        const hasInboxDesktopInAppPayments = useHasInboxDesktopInAppPayments();
        const [organization, loadingOrganization] = useOrganization();
        const [modalState, setModalState, render] = useModalState();

        const depsLoading = loadingSubscription || loadingPlans || loadingOrganization || statusLoading;

        const { sendReportDrivePostSignup } = useDrivePostSignupOneDollarTelemetry();

        useImperativeHandle(ref, () => {
            return {
                isOpened: modalState.open,
                open: (subscriptionProps) => {
                    subscriptionPropsRef.current = subscriptionProps;
                    setModalState(true);
                },
            };
        });

        useEffect(() => {
            if (!depsLoading) {
                onDepsLoaded();
            }
        }, [depsLoading]);

        if (depsLoading || !subscriptionPropsRef.current || !(organization && subscription && render && status)) {
            return null;
        }

        if (isManagedExternally(subscription)) {
            return <InAppPurchaseModal subscription={subscription} {...modalState} />;
        } else if (isBilledUser(user)) {
            return <BilledUserModal user={user} {...modalState} />;
        }

        const {
            hasClose,
            onClose: subscriptionPropsOnClose,
            disableCloseOnEscape,
            fullscreen,
            onSubscribed,
            onUnsubscribed,
            mode,
            currency,
            upsellRef,
            ...rest
        } = subscriptionPropsRef.current;

        if (hasInboxDesktopInAppPayments && modalState.open) {
            void invokeInboxDesktopIPC({ type: 'subscriptionModalOpened', payload: 'subscriptionModalStarted' });
        }

        // This is required since we cannot pay inside the Drive app
        const sendTelemetry = () => {
            if (rest?.coupon === COUPON_CODES.TRYDRIVEPLUS2024) {
                sendReportDrivePostSignup({
                    event: TelemetryMailDrivePostSignupOneDollar.userSubscribed,
                    dimensions: {},
                });
            }
        };

        const handleClose = () => {
            if (hasInboxDesktopInAppPayments) {
                void invokeInboxDesktopIPC({
                    type: 'subscriptionModalOpened',
                    payload: 'subscriptionModalFinished',
                });
            }

            onClose?.();
            subscriptionPropsOnClose?.();
            modalState.onClose();
            subscriptionPropsRef.current = null;
        };

        const handleSubscribed = () => {
            sendTelemetry();
            handleClose();
            onSubscribed?.();
        };

        const handleUnsubscribed = () => {
            handleClose();
            onUnsubscribed?.();
        };

        let blurBackdrop = true;
        let rootClassName: string | undefined;
        if (getHas2024OfferCoupon(rest.coupon)) {
            blurBackdrop = false;
            if (app === APPS.PROTONVPN_SETTINGS) {
                rootClassName = 'subscription-modal-bf-bg subscription-modal--vpn-bg';
            } else if (app === APPS.PROTONPASS) {
                rootClassName = 'subscription-modal-bf-bg subscription-modal--pass-bg';
            } else if (app === APPS.PROTONDRIVE) {
                rootClassName = 'subscription-modal-bf-bg subscription-modal--drive-bg';
            } else {
                rootClassName = 'subscription-modal-bf-bg subscription-modal--mail-bg';
            }
        }

        return (
            <SubscriptionContainer
                parent="subscription-modal"
                app={app}
                subscription={subscription}
                plans={plans}
                freePlan={freePlan}
                organization={organization}
                onSubscribed={handleSubscribed}
                onUnsubscribed={handleUnsubscribed}
                onCancel={handleClose}
                mode={mode}
                currency={currency}
                paymentsStatus={status}
                upsellRef={upsellRef}
                // Post subscription has advantage over config
                disableThanksStep={postSubscriptionProps.disableThanksStep ?? rest.disableThanksStep}
                {...rest}
                render={({ onSubmit, title, content, footer, step, planIDs }) => {
                    const modal = (
                        <ModalTwo
                            blurBackdrop={blurBackdrop}
                            className={clsx([
                                subscriptionModalClassName,
                                [SUBSCRIPTION_STEPS.PLAN_SELECTION, SUBSCRIPTION_STEPS.CHECKOUT].includes(step) &&
                                    'subscription-modal--fixed-height',
                                [SUBSCRIPTION_STEPS.PLAN_SELECTION].includes(step) && 'subscription-modal--large-width',
                                [SUBSCRIPTION_STEPS.CHECKOUT].includes(step) && 'subscription-modal--medium-width',
                            ])}
                            rootClassName={rootClassName}
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

                    if (isOverridablableStep(step)) {
                        return (
                            postSubscriptionProps.renderCustomStepModal({
                                modalProps: {
                                    ...modalState,
                                    onClose: handleSubscribed,
                                },
                                planIDs,
                                step,
                                upsellRef,
                            }) || modal
                        );
                    }

                    return modal;
                }}
            />
        );
    }
);

SubscriptionModal.displayName = 'SubscriptionModal';

export default SubscriptionModal;
