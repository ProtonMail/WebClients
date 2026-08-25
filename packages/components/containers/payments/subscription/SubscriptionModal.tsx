import { useUser } from '@proton/account/user/hooks';
import { useConfig } from '@proton/app-context/useConfig';
import type { BillingAddressExtended } from '@proton/payments/core/billing-address/billing-address';
import { COUPON_CODES, PLANS } from '@proton/payments/core/constants';
import type { FreeSubscription, PaymentStatus } from '@proton/payments/core/interface';
import type { FreePlanDefault, Plan } from '@proton/payments/core/plan/interface';
import { getAvailableSubscriptionActions, getHas2025OfferCoupon } from '@proton/payments/core/subscription/helpers';
import type { Subscription } from '@proton/payments/core/subscription/interface';
import { checkoutTelemetry } from '@proton/payments/telemetry/telemetry';
import { TelemetryMailDrivePostSignupOneDollarEvents } from '@proton/shared/lib/api/telemetry';
import { APPS, type APP_NAMES } from '@proton/shared/lib/constants';
import { invokeInboxDesktopIPC } from '@proton/shared/lib/desktop/ipcHelpers';
import { type Organization, isBilledUser } from '@proton/shared/lib/interfaces';
import clsx from '@proton/utils/clsx';

import ModalTwo from '../../../components/modalTwo/Modal';
import ModalTwoContent from '../../../components/modalTwo/ModalContent';
import ModalTwoFooter from '../../../components/modalTwo/ModalFooter';
import ModalTwoHeader from '../../../components/modalTwo/ModalHeader';
import type { ModalStateProps } from '../../../components/modalTwo/useModalState';
import { usePaidUsersNudgeTelemetry } from '../../../components/topnavbar/TopNavbarPostSignupPromo/PaidUsersNudge/hooks/usePaidUsersNudgeTelemetry';
import { useDrivePostSignupOneDollarTelemetry } from '../../../components/topnavbar/TopNavbarPostSignupPromo/PostSignupOneDollar/DrivePostSignupOneDollar/useDrivePostSignupOneDollarTelemetry';
import { BilledUserModal } from '../../../payments/client-extensions/billed-user/index';
import { useHasInboxDesktopInAppPayments } from '../../desktop/useHasInboxDesktopInAppPayments';
import InAppPurchaseModal from './InAppPurchaseModal';
import SubscriptionContainer from './SubscriptionContainer';
import type { OpenCallbackProps, SubscriptionOverridableStep } from './SubscriptionModalProvider';
import { SUBSCRIPTION_STEPS, subscriptionModalClassName } from './constants';
import { usePostSubscription } from './postSubscription/usePostSubscription';

interface Props {
    app: APP_NAMES;
    onClose?: () => void;
    subscription: Subscription | FreeSubscription;
    initialBillingAddress: BillingAddressExtended;
    plans: Plan[];
    freePlan: FreePlanDefault;
    organization: Organization;
    paymentStatus: PaymentStatus;
    modalState: ModalStateProps;
    subscriptionProps: OpenCallbackProps;
}

const isOverridablableStep = (step: SUBSCRIPTION_STEPS): step is SubscriptionOverridableStep =>
    [SUBSCRIPTION_STEPS.UPGRADE, SUBSCRIPTION_STEPS.THANKS].includes(step);

const SubscriptionModal = ({
    app,
    onClose,
    initialBillingAddress,
    subscription,
    plans,
    freePlan,
    organization,
    paymentStatus,
    modalState,
    subscriptionProps,
}: Props) => {
    const [user] = useUser();
    const postSubscriptionProps = usePostSubscription();
    const hasInboxDesktopInAppPayments = useHasInboxDesktopInAppPayments();
    const { APP_NAME } = useConfig();

    const { sendReportDrivePostSignup } = useDrivePostSignupOneDollarTelemetry();
    const { sendDrivePurchaseReport } = usePaidUsersNudgeTelemetry({ plan: PLANS.DRIVE });

    const subscriptionActions = getAvailableSubscriptionActions(subscription);
    if (!subscriptionActions.canModify) {
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
    } = subscriptionProps;

    if (hasInboxDesktopInAppPayments && modalState.open) {
        void invokeInboxDesktopIPC({ type: 'subscriptionModalOpened', payload: 'subscriptionModalStarted' });
    }

    // This is required since we cannot pay inside the Drive app
    const sendTelemetry = () => {
        if (rest?.coupon === COUPON_CODES.TRYDRIVEPLUS2024) {
            sendReportDrivePostSignup({
                event: TelemetryMailDrivePostSignupOneDollarEvents.userSubscribed,
                dimensions: {},
            });
        } else if (rest?.coupon === COUPON_CODES.ANNUALOFFER25) {
            sendDrivePurchaseReport();
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

        checkoutTelemetry.subscriptionContainer.reportClosedByUser({
            build: APP_NAME,
            product: app,
        });
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
    if (getHas2025OfferCoupon(rest.coupon)) {
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
            paymentStatus={paymentStatus}
            upsellRef={upsellRef}
            // Post subscription has advantage over config
            disableThanksStep={postSubscriptionProps.disableThanksStep ?? rest.disableThanksStep}
            initialBillingAddress={initialBillingAddress}
            {...rest}
            render={({ onSubmit, title, content, footer, step, planIDs }) => {
                const isUpgradeOrThanks = [SUBSCRIPTION_STEPS.UPGRADE, SUBSCRIPTION_STEPS.THANKS].includes(step);
                const isCheckout = step === SUBSCRIPTION_STEPS.CHECKOUT;
                const isPlanSelection = step === SUBSCRIPTION_STEPS.PLAN_SELECTION;

                const modal = (
                    <ModalTwo
                        blurBackdrop={blurBackdrop}
                        className={clsx([
                            subscriptionModalClassName,
                            isPlanSelection && 'subscription-modal--fixed-height subscription-modal--large-width',
                            isCheckout && 'subscription-modal--fixed-height subscription-modal--medium-width',
                        ])}
                        rootClassName={rootClassName}
                        data-testid="plansModal"
                        {...modalState}
                        onClose={handleClose}
                        disableCloseOnEscape={disableCloseOnEscape}
                        fullscreen={fullscreen}
                        as="form"
                        size={isUpgradeOrThanks ? 'xsmall' : 'large'}
                        onSubmit={onSubmit}
                    >
                        {isUpgradeOrThanks ? null : <ModalTwoHeader title={title} hasClose={hasClose} />}
                        {isUpgradeOrThanks ? content : <ModalTwoContent>{content}</ModalTwoContent>}
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
};

SubscriptionModal.displayName = 'SubscriptionModal';

export default SubscriptionModal;
