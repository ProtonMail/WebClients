import { useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { getCanMakePaymentsWithActiveCard } from '@proton/chargebee/lib';
import Loader from '@proton/components/components/loader/Loader';
import useConfig from '@proton/components/hooks/useConfig';
import useModals from '@proton/components/hooks/useModals';
import useNotifications from '@proton/components/hooks/useNotifications';
import {
    type ApplePayModalHandles,
    type CardPayment,
    type ChargebeeIframeHandles,
    type ChargebeePaypalModalHandles,
    type FreeSubscription,
    type GooglePayModalHandles,
    PAYMENT_METHOD_TYPES,
    type PaymentVerificator,
    type PaymentVerificatorV5,
    type PaymentVerificatorV5Params,
    type Subscription,
    type SubscriptionEstimation,
    type V5PaymentToken,
    ensureTokenChargeableV5,
    toV5PaymentToken,
} from '@proton/payments';
import type { PaymentTelemetryContext } from '@proton/payments/telemetry/helpers';
import type { PaymentStage } from '@proton/payments/telemetry/shared-checkout-telemetry';
import { checkoutTelemetry } from '@proton/payments/telemetry/telemetry';
import { getChargebeeErrorMessage } from '@proton/payments/ui';
import type { ProductParam } from '@proton/shared/lib/apps/product';
import type { Api, User } from '@proton/shared/lib/interfaces';
import useFlag from '@proton/unleash/useFlag';
import isTruthy from '@proton/utils/isTruthy';

import ModalTwo, { type ModalOwnProps } from '../../../components/modalTwo/Modal';
import ModalTwoContent from '../../../components/modalTwo/ModalContent';
import ModalTwoFooter from '../../../components/modalTwo/ModalFooter';
import ModalTwoHeader from '../../../components/modalTwo/ModalHeader';
import { defaultTranslations, ensureTokenChargeable } from '../ensureTokenChargeable';
import { abortSignalAny } from './AbortSignalAny';
import PaymentVerificationModal from './PaymentVerificationModal';

/**
 * Default implementation of the payment verificator for credit cards.
 * Once the function is called, it renders a modal that warns user about the upcoming 3DS verification.
 * When user confirms it, opens the verification page. Usually it's page of the bank, or PayPal's page,
 * or in case of Braintree it's a custom page that we render on our backend.
 * The implemntation depends on createModal function (useModal hook as of now) and on the API.
 *
 * @returns a function that returns a promise that resolves to a token payment method.
 * It can reject if user cancels the verification. Beyond that, verification can fail because of API error or because
 * user actually failed verification. This cases are handled inside {@link ensureTokenChargeable} and
 * {@link PaymentVerificationModal}. Such errors don't require Sentry error at the time being, as they are
 * communicated to the user might be gracefully handled by the view by offering user a retry.
 */
export const getDefaultVerifyPayment = (createModal: (modal: JSX.Element) => void, api: Api): PaymentVerificator =>
    async function verify({
        addCardMode,
        Payment,
        Token,
        ApprovalURL,
        ReturnHost,
    }: Parameters<PaymentVerificator>[0]): Promise<V5PaymentToken> {
        return new Promise<V5PaymentToken>((resolve, reject) => {
            createModal(
                <PaymentVerificationModal
                    isAddCard={addCardMode}
                    payment={Payment as CardPayment}
                    onSubmit={() => resolve(toV5PaymentToken(Token))}
                    onClose={reject}
                    onProcess={() => {
                        const abort = new AbortController();
                        return {
                            promise: ensureTokenChargeable({
                                Token,
                                api,
                                ReturnHost,
                                ApprovalURL,
                                signal: abort.signal,
                            }),
                            abort,
                        };
                    }}
                />
            );
        });
    };

/**
 * This function is very similar to {@link getDefaultVerifyPayment}, but it's used for PayPal.
 * There are differences in the configuration, but the overall idea and behavior is the same.
 * @returns
 */
export const getDefaultVerifyPaypal = (createModal: (modal: JSX.Element) => void, api: Api): PaymentVerificator => {
    return async function verify({ Token, ApprovalURL, ReturnHost }) {
        const paymentToken = await new Promise<V5PaymentToken>((resolve, reject) => {
            const onProcess = () => {
                const abort = new AbortController();
                return {
                    promise: ensureTokenChargeable({
                        Token,
                        api,
                        ReturnHost,
                        ApprovalURL,
                        signal: abort.signal,
                    }),
                    abort,
                };
            };
            createModal(
                <PaymentVerificationModal
                    onSubmit={() => resolve(toV5PaymentToken(Token))}
                    onClose={reject}
                    type={PAYMENT_METHOD_TYPES.PAYPAL}
                    onProcess={onProcess}
                    initialProcess={onProcess()}
                />
            );
        });

        return paymentToken;
    };
};

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

export const PendingValidationModal = ({
    type,
    ...props
}: Omit<ModalOwnProps, 'children'> & {
    type: 'chargebee-paypal' | 'google-pay';
}) => {
    const [hasClose, setHasClose] = useState(false);
    useEffect(() => {
        const timeout = setTimeout(() => {
            setHasClose(true);
        }, 10000);
        return () => clearTimeout(timeout);
    }, []);

    const redirectionWarningText =
        type === 'chargebee-paypal'
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
                type="chargebee-paypal"
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
                type="google-pay"
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
