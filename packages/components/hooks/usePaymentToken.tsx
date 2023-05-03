import { Api } from '@proton/shared/lib/interfaces';

import { PaymentVerificationModal } from '../containers';
import { TokenPaymentMethod } from '../containers/payments/interface';
import { VerifyPayment, getCreatePaymentToken, process } from '../containers/payments/paymentTokenHelper';
import useApi from './useApi';
import useModals from './useModals';

export const getDefaultVerifyPayment = (createModal: (modal: JSX.Element) => void, api: Api): VerifyPayment =>
    async function verify({
        addCardMode,
        Payment,
        Token,
        ApprovalURL,
        ReturnHost,
    }: Parameters<VerifyPayment>[0]): Promise<TokenPaymentMethod> {
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
                            promise: process({
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

const usePaymentToken = () => {
    const api = useApi();
    const { createModal } = useModals();

    return getCreatePaymentToken(getDefaultVerifyPayment(createModal, api), api);
};

export default usePaymentToken;
