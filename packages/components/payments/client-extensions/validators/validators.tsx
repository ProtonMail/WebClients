import { useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import { FormModal, Loader } from '@proton/components/components';
import { useModals, useNotifications } from '@proton/components/hooks';
import {
    type ChargebeePaypalModalHandles,
    PAYMENT_METHOD_TYPES,
    type PaymentVerificator,
    type PaymentVerificatorV5,
    type PaymentVerificatorV5Params,
    type V5PaymentToken,
    ensureTokenChargeableV5,
    toV5PaymentToken,
} from '@proton/payments';
import { type Api } from '@proton/shared/lib/interfaces';

import { getChargebeeErrorMessage } from '../../chargebee/ChargebeeIframe';
import { defaultTranslations, ensureTokenChargeable } from '../ensureTokenChargeable';
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
                    payment={Payment}
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

export const useChargebeeCardVerifyPayment = (api: Api): PaymentVerificatorV5 => {
    const { createModal } = useModals();
    const { createNotification } = useNotifications();

    async function verifyChargebee({
        token,
        events,
        addCardMode,
    }: PaymentVerificatorV5Params): Promise<V5PaymentToken> {
        const tokenPaymentMethod = await new Promise<V5PaymentToken>((resolve, reject) => {
            const abort = new AbortController();
            const dependencies = {
                api,
                signal: abort.signal,
            };

            const run = () => ensureTokenChargeableV5(token, events, dependencies, defaultTranslations);

            if (token.authorized) {
                run()
                    .then(() => resolve(token))
                    .catch((error) => {
                        if (error && error.message && !error.config) {
                            createNotification({ text: error.message, type: 'error' });
                        }
                    });
                return;
            }

            createModal(
                <PaymentVerificationModal
                    isAddCard={addCardMode}
                    onSubmit={() => resolve(token)}
                    onClose={reject}
                    onProcess={() => ({
                        promise: run(),
                        abort,
                    })}
                />
            );
        });

        return tokenPaymentMethod;
    }

    return verifyChargebee;
};

export const ChargebeePaypalValidationModal = (props: any) => {
    const [hasClose, setHasClose] = useState(false);
    useEffect(() => {
        const timeout = setTimeout(() => {
            setHasClose(true);
        }, 10000);
        return () => clearTimeout(timeout);
    }, []);

    return (
        <FormModal footer={null} hasClose={hasClose} {...props}>
            <p className="text-center">{c('Info').t`You will soon be redirected to PayPal to verify your payment.`}</p>
            <Loader />
            <p className="text-center mb-4">{c('Info').t`Don’t see anything? Remember to turn off pop-up blockers.`}</p>
        </FormModal>
    );
};

export function useChargebeePaypalHandles({
    onPaymentAttempt,
    onPaymentFailure,
}: {
    onPaymentAttempt: (method: 'chargebee-paypal') => void;
    onPaymentFailure: (method: 'chargebee-paypal') => void;
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
        hideModal();
    };

    const showModal = () => {
        if (modalIdRef.current) {
            hideModal();
        }

        const id = createModal(<ChargebeePaypalValidationModal onClose={() => hideModal()} />);
        modalIdRef.current = id;
    };

    const onFailure = (error: any) => {
        onPaymentFailure('chargebee-paypal');
        hideModal(error);
    };

    const onAuthorize = () => {
        hideModal();
    };

    const onClick = () => {
        onPaymentAttempt('chargebee-paypal');
        showModal();
    };

    return {
        onCancel,
        onFailure,
        onAuthorize,
        onClick,
    };
}
