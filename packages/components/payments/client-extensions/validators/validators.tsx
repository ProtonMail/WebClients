import { Api } from '@proton/shared/lib/interfaces';

import { PAYMENT_METHOD_TYPES, PaymentVerificator, TokenPaymentMethod } from '../../core';
import { ensureTokenChargeable } from '../ensureTokenChargeable';
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
    }: Parameters<PaymentVerificator>[0]): Promise<TokenPaymentMethod> {
        return new Promise<TokenPaymentMethod>((resolve, reject) => {
            createModal(
                <PaymentVerificationModal
                    isAddCard={addCardMode}
                    payment={Payment}
                    token={Token}
                    onSubmit={resolve}
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
        const tokenPaymentMethod = await new Promise<TokenPaymentMethod>((resolve, reject) => {
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
                    token={Token}
                    onSubmit={resolve}
                    onClose={reject}
                    type={PAYMENT_METHOD_TYPES.PAYPAL}
                    onProcess={onProcess}
                    initialProcess={onProcess()}
                />
            );
        });

        return tokenPaymentMethod;
    };
};
