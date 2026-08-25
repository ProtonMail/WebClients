import { useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import { useConfig } from '@proton/app-context/useConfig';
import { useNotifications } from '@proton/app-context/useNotifications';
import { Button } from '@proton/atoms/Button/Button';
import { getCanMakePaymentsWithActiveCard } from '@proton/chargebee/lib/getCanMakePaymentsWithActiveCard';
import { PAYMENT_METHOD_TYPES } from '@proton/payments/core/constants';
import type { PaymentVerificatorV5, PaymentVerificatorV5Params } from '@proton/payments/core/createPaymentToken';
import { ensureTokenChargeableV5 } from '@proton/payments/core/ensureTokenChargeable';
import type { ChargebeeIframeHandles, FreeSubscription, V5PaymentToken } from '@proton/payments/core/interface';
import type { ChargebeePaypalModalHandles } from '@proton/payments/core/payment-processors/chargebeePaypalPayment';
import type { ApplePayModalHandles } from '@proton/payments/core/payment-processors/useApplePay';
import type { GooglePayModalHandles } from '@proton/payments/core/payment-processors/useGooglePay';
import { SubscriptionMode } from '@proton/payments/core/subscription/constants';
import type { Subscription, SubscriptionEstimation } from '@proton/payments/core/subscription/interface';
import type { PaymentTelemetryContext } from '@proton/payments/telemetry/helpers';
import type { PaymentStage } from '@proton/payments/telemetry/shared-checkout-telemetry';
import { checkoutTelemetry } from '@proton/payments/telemetry/telemetry';
import { getChargebeeErrorMessage } from '@proton/payments/ui/components/ChargebeeIframe';
import type { ProductParam } from '@proton/shared/lib/apps/product';
import type { Api, User } from '@proton/shared/lib/interfaces';
import { useFlag } from '@proton/unleash/useFlag';
import isTruthy from '@proton/utils/isTruthy';

import useModals from '../../..//hooks/useModals';
import Loader from '../../../components/loader/Loader';
import ModalTwo, { type ModalOwnProps } from '../../../components/modalTwo/Modal';
import ModalTwoContent from '../../../components/modalTwo/ModalContent';
import ModalTwoFooter from '../../../components/modalTwo/ModalFooter';
import ModalTwoHeader from '../../../components/modalTwo/ModalHeader';
import { defaultTranslations } from '../ensureTokenChargeable';
import { abortSignalAny } from './AbortSignalAny';
import PaymentVerificationModal from './PaymentVerificationModal';

type Dependencies = {
    user?: User;
    subscription?: Subscription | FreeSubscription;
    checkResult?: SubscriptionEstimation;
    product: ProductParam;
    telemetryContext: PaymentTelemetryContext;
};

export const useChargebeeCardVerifyPayment = (
    api: Api,
    { user, subscription, checkResult, product, telemetryContext }: Dependencies
): PaymentVerificatorV5 => {
    const { createModal, removeModal } = useModals();
    const { createNotification } = useNotifications();
    const modalIdRef = useRef<string | null>(null);
    const { APP_NAME } = useConfig();

    async function verifyChargebee({
        token,
        events,
        addCardMode,
        abortController: cancelledByCaller,
        onCancelled,
        onError,
        paymentMethodType,
        paymentMethodValue,
    }: PaymentVerificatorV5Params): Promise<V5PaymentToken> {
        const tokenPaymentMethod = await new Promise<V5PaymentToken>((resolve, reject) => {
            const sendTelemetry = (stage: PaymentStage) => {
                if (checkResult) {
                    checkoutTelemetry.reportPayment({
                        stage,
                        paymentMethodType,
                        paymentMethodValue,
                        amount: checkResult.AmountDue,
                        userCurrency: user?.Currency,
                        subscription,
                        selectedCycle: checkResult.Cycle,
                        selectedPlanIDs: checkResult.requestData.Plans,
                        selectedCurrency: checkResult.Currency,
                        selectedCoupon: checkResult.Coupon?.Code,
                        build: APP_NAME,
                        product,
                        context: telemetryContext,
                        isTrial: checkResult.SubscriptionMode === SubscriptionMode.Trial,
                    });
                }
            };

            const cancelledByUser = new AbortController();

            const cancelledByAnything = abortSignalAny(
                [cancelledByUser.signal, cancelledByCaller?.signal].filter(isTruthy)
            );

            const run = () =>
                ensureTokenChargeableV5({
                    token,
                    events,
                    api,
                    signal: cancelledByAnything,
                    translations: defaultTranslations,
                    onCancelled,
                    onError,
                });

            if (token.authorized) {
                run()
                    .then(() => resolve(token))
                    .catch((error) => {
                        if (error && error.message && !error.config) {
                            createNotification({ text: error.message, type: 'error' });
                        }

                        reject();
                    });
                return;
            }

            sendTelemetry('verification_required');

            modalIdRef.current = createModal(
                <PaymentVerificationModal
                    isAddCard={addCardMode}
                    onSubmit={() => {
                        sendTelemetry('verification_success');
                        resolve(token);
                    }}
                    onClose={(reason) => {
                        reject();
                        if (reason === 'cancelled') {
                            onCancelled?.();
                        }
                    }}
                    onProcess={() => ({
                        promise: run(),
                        abort: cancelledByUser,
                    })}
                    onVerificationAttempted={() => sendTelemetry('verification_attempted_by_user')}
                    onVerificationFailed={() => sendTelemetry('verification_failure')}
                    onVerificationRejectedByUser={() => sendTelemetry('verification_rejected_by_user')}
                />
            );

            cancelledByCaller?.signal.addEventListener('abort', () => {
                if (modalIdRef.current) {
                    removeModal(modalIdRef.current);
                }
            });
        });

        return tokenPaymentMethod;
    }

    return verifyChargebee;
};

const PendingValidationModal = ({
    type,
    ...props
}: Omit<ModalOwnProps, 'children'> & {
    type:
        PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL | PAYMENT_METHOD_TYPES.GOOGLE_PAY | PAYMENT_METHOD_TYPES.CHARGEBEE_IDEAL;
}) => {
    const [hasClose, setHasClose] = useState(false);
    useEffect(() => {
        const timeout = setTimeout(() => {
            setHasClose(true);
        }, 10000);
        return () => clearTimeout(timeout);
    }, []);

    const redirectionWarningText =
        type === PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL
            ? c('Payments').t`You will soon be redirected to PayPal to verify your payment.`
            : c('Payments').t`You will soon be redirected to verify your payment.`;

    return (
        <ModalTwo {...props}>
            <ModalTwoHeader title={c('Title').t`Verifying your payment...`} hasClose={hasClose} />
            <ModalTwoContent>
                <p>{redirectionWarningText}</p>
                <Loader />
                <p>{c('Info').t`Don’t see anything? Remember to turn off pop-up blockers.`}</p>
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button onClick={props.onClose}>{c('Action').t`Cancel`}</Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export function useChargebeePaypalHandles({
    onPaymentFailure,
    onVerificationCancelled,
    onVerificationSuccess,
}: {
    onPaymentFailure: () => void;
    onVerificationCancelled: () => void;
    onVerificationSuccess: () => void;
}): ChargebeePaypalModalHandles {
    const { createModal, removeModal } = useModals();
    const { createNotification } = useNotifications();
    const modalIdRef = useRef<string | null>(null);

    const hideModal = (error?: any) => {
        if (!modalIdRef.current) {
            return;
        }

        removeModal(modalIdRef.current);
        modalIdRef.current = null;

        if (error) {
            createNotification({ text: getChargebeeErrorMessage(error), type: 'error' });
        }
    };

    const onCancel = () => {
        onVerificationCancelled();
        hideModal();
    };

    const showModal = () => {
        if (modalIdRef.current) {
            hideModal();
        }

        const id = createModal(
            <PendingValidationModal
                type={PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL}
                onClose={() => {
                    onVerificationCancelled();
                    hideModal();
                }}
            />
        );
        modalIdRef.current = id;
    };

    const onFailure = (error: any) => {
        onPaymentFailure();
        hideModal(error);
    };

    const onAuthorize = () => {
        onVerificationSuccess();
        hideModal();
    };

    const onClick = () => {
        showModal();
    };

    return {
        onCancel,
        onFailure,
        onAuthorize,
        onClick,
    };
}

export function useChargebeeIdealHandles({
    onPaymentFailure,
    onVerificationCancelled,
    onVerificationSuccess,
}: {
    onPaymentFailure: () => void;
    onVerificationCancelled: () => void;
    onVerificationSuccess: () => void;
}) {
    const { createModal, removeModal } = useModals();
    const { createNotification } = useNotifications();
    const modalIdRef = useRef<string | null>(null);

    const hideModal = (error?: any) => {
        if (!modalIdRef.current) {
            return;
        }

        removeModal(modalIdRef.current);
        modalIdRef.current = null;

        if (error) {
            createNotification({ text: getChargebeeErrorMessage(error), type: 'error' });
        }
    };

    const onCancel = () => {
        onVerificationCancelled();
        hideModal();
    };

    const onClick = () => {
        if (modalIdRef.current) {
            hideModal();
        }

        const id = createModal(
            <PendingValidationModal
                type={PAYMENT_METHOD_TYPES.CHARGEBEE_IDEAL}
                onClose={() => {
                    onVerificationCancelled();
                    hideModal();
                }}
            />
        );
        modalIdRef.current = id;
    };

    const onFailure = (error: any) => {
        onPaymentFailure();
        hideModal(error);
    };

    const onAuthorize = () => {
        onVerificationSuccess();
        hideModal();
    };

    return {
        onCancel,
        onFailure,
        onAuthorize,
        onClick,
    };
}

export const useApplePayDependencies = (
    chargebeeHandles: ChargebeeIframeHandles,
    {
        onPaymentFailure,
        onVerificationCancelled,
        onVerificationSuccess,
    }: {
        onPaymentFailure: () => void;
        onVerificationCancelled: () => void;
        onVerificationSuccess: () => void;
    }
) => {
    const [canUseApplePay, setCanUseApplePay] = useState(false);
    const { createNotification } = useNotifications();

    const checkApplePay = async (): Promise<boolean> => {
        try {
            const [canUseApplePayFromCurrentDomain, canUseApplePayFromChargebeeIframe] = await Promise.all([
                getCanMakePaymentsWithActiveCard(),
                chargebeeHandles.getCanMakePaymentsWithActiveCard(),
            ]);

            return canUseApplePayFromCurrentDomain && canUseApplePayFromChargebeeIframe;
        } catch {
            return false;
        }
    };

    useEffect(() => {
        async function run() {
            const result = await checkApplePay();
            setCanUseApplePay(result);
        }

        void run();
    }, []);

    const applePayModalHandles: ApplePayModalHandles = {
        onAuthorize: () => {
            onVerificationSuccess();
        },
        onClick: () => {},
        onFailure: (error?: any) => {
            onPaymentFailure();
            if (error) {
                createNotification({ text: getChargebeeErrorMessage(error), type: 'error' });
            }
        },
        onCancel: () => {
            onVerificationCancelled();
        },
    };

    return { canUseApplePay, applePayModalHandles };
};

export const useGooglePayDependencies = (
    chargebeeHandles: ChargebeeIframeHandles,
    {
        onPaymentFailure,
        onVerificationSuccess,
        onVerificationCancelled,
    }: {
        onPaymentFailure: () => void;
        onVerificationSuccess: () => void;
        onVerificationCancelled: () => void;
    }
) => {
    const googlePayEnabled = useFlag('GooglePay');

    const { createNotification } = useNotifications();
    const modalIdRef = useRef<string | null>(null);
    const { createModal, removeModal } = useModals();
    const showErrorRef = useRef(true);

    const hideModal = (error?: any) => {
        if (error && showErrorRef.current) {
            showErrorRef.current = false;
            createNotification({ text: getChargebeeErrorMessage(error), type: 'error' });
        }

        if (!modalIdRef.current) {
            return;
        }

        removeModal(modalIdRef.current);
        modalIdRef.current = null;
    };

    const showModal = () => {
        if (modalIdRef.current) {
            hideModal();
        }

        const id = createModal(
            <PendingValidationModal
                type={PAYMENT_METHOD_TYPES.GOOGLE_PAY}
                onClose={() => {
                    hideModal();
                    onVerificationCancelled();
                }}
            />
        );
        modalIdRef.current = id;
    };

    const googlePayModalHandles: GooglePayModalHandles = {
        onAuthorize: () => {
            hideModal();
            onVerificationSuccess();
        },
        onClick: () => {
            showModal();
            showErrorRef.current = true;
        },
        onFailure: (error?: any) => {
            onPaymentFailure();
            hideModal(error);
        },
        onCancel: () => {
            onVerificationCancelled();
            hideModal();
        },
        on3DSChallenge: () => {
            hideModal();
        },
        onInitialize: () => {},
    };

    return { canUseGooglePay: googlePayEnabled, googlePayModalHandles };
};
