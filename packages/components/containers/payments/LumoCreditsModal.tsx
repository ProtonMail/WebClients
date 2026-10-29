import { c } from 'ttag';

import { useGetPaymentMethods } from '@proton/account/paymentMethods/hooks';
import { useSubscription } from '@proton/account/subscription/hooks';
import { useApi } from '@proton/app-context/useApi';
import { useNotifications } from '@proton/app-context/useNotifications';
import { getBuyLumoCreditConfig } from '@proton/payments/core/api/createPaymentSubscription';
import { CacheType } from '@proton/redux-utilities/interface';
import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';

import Loader from '../../components/loader/Loader';
import { TopUpModal, type TopUpModalProps } from './TopUpModal';

export const LumoCreditsModal = (props: TopUpModalProps) => {
    const api = useApi();
    const { createNotification } = useNotifications();
    const getPaymentMethods = useGetPaymentMethods();
    const [subscription, loadingSubscription] = useSubscription();

    if (loadingSubscription) {
        return <Loader />;
    }

    const { CountryCode, State, ZipCode } = props.paymentStatus;

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
            onTopUp={async (_, { chargeablePaymentParameters }) => {
                const { PaymentToken, Amount, Currency } = chargeablePaymentParameters;
                await api(
                    getBuyLumoCreditConfig(props.app, {
                        PaymentToken,
                        Amount,
                        Currency,
                        BillingAddress: { CountryCode, State, ZipCode },
                    })
                );

                await getPaymentMethods({ cache: CacheType.None });
                createNotification({ text: c('Success').t`Funds added` });
            }}
        />
    );
};
