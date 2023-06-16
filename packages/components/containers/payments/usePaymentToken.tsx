import { ensureTokenChargeable } from '@proton/components/payments/client-extensions';
import { PAYMENT_METHOD_TYPES, PaymentVerificator, getCreatePaymentToken } from '@proton/components/payments/core';
import { Api } from '@proton/shared/lib/interfaces';

import { PaymentVerificationModal } from '..';
import useApi from '../../hooks/useApi';
import useModals from '../../hooks/useModals';
import { TokenPaymentMethod } from '../../payments/core/interface';

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

const usePaymentToken = () => {
    const api = useApi();
    const { createModal } = useModals();

    return getCreatePaymentToken(getDefaultVerifyPayment(createModal, api), api);
};

export default usePaymentToken;
