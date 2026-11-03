import { c } from 'ttag';

import { useGetPaymentMethods } from '@proton/account/paymentMethods/hooks';
import { useSubscription } from '@proton/account/subscription/hooks';
import { useApi } from '@proton/app-context/useApi';
import { useNotifications } from '@proton/app-context/useNotifications';
import { MIN_LUMO_CREDIT_AMOUNT } from '@proton/payments/core/amount-limits';
import {
    type ProductCheckResponse,
    getBuyLumoCreditConfig,
    getCheckLumoCreditConfig,
} from '@proton/payments/core/api/createPaymentSubscription';
import { CacheType } from '@proton/redux-utilities/interface';
import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';

import Loader from '../../components/loader/Loader';
import { TopUpModal, type TopUpModalProps } from './TopUpModal';

export const LumoCreditsModal = ({ onSuccess, ...props }: TopUpModalProps & { onSuccess?: () => void }) => {
    const api = useApi();
    const { createNotification } = useNotifications();
    const getPaymentMethods = useGetPaymentMethods();
    const [subscription, loadingSubscription] = useSubscription();

    if (loadingSubscription) {
        return <Loader />;
    }

    const { CountryCode, State, ZipCode } = props.paymentStatus;
    const billingAddress = { CountryCode, State, ZipCode };

    return (
        <TopUpModal
            {...props}
            title={c('Title').t`Add funds`}
            renderDescription={() =>
                c('Info').t`Top up your ${LUMO_SHORT_APP_NAME} API balance. API usage is deducted from this balance.`
            }
            sentryComponent="lumo-credits-modal"
            flow="lumo-credit"
            initialCurrency={subscription?.Currency}
            minAmount={MIN_LUMO_CREDIT_AMOUNT}
            checkTopUp={(amount, currency) =>
                api<ProductCheckResponse>(
                    getCheckLumoCreditConfig({
                        CreditAmount: amount,
                        Currency: currency,
                        BillingAddress: billingAddress,
                    })
                )
            }
            onTopUpFromAccountCredit={async (credits, currency) => {
                await api(
                    getBuyLumoCreditConfig(props.app, {
                        PaymentToken: undefined,
                        Amount: 0,
                        Currency: currency,
                        CreditAmount: credits,
                        BillingAddress: billingAddress,
                    })
                );
                onSuccess?.();
                createNotification({ text: c('Success').t`Funds added` });
            }}
            onTopUp={async (_, { chargeablePaymentParameters }, credits) => {
                const { PaymentToken, Amount, Currency } = chargeablePaymentParameters;
                await api(
                    getBuyLumoCreditConfig(props.app, {
                        PaymentToken,
                        Amount,
                        Currency,
                        CreditAmount: credits,
                        BillingAddress: billingAddress,
                    })
                );
                onSuccess?.();

                await getPaymentMethods({ cache: CacheType.None });
                createNotification({ text: c('Success').t`Funds added` });
            }}
        />
    );
};
