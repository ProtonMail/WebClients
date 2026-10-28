import { c } from 'ttag';

import { useGetPaymentMethods } from '@proton/account/paymentMethods/hooks';
import { useConfig } from '@proton/app-context/useConfig';
import { useNotifications } from '@proton/app-context/useNotifications';
import { Href } from '@proton/atoms/Href/Href';
import { usePaymentPollers } from '@proton/payments-ui/ui/hooks/usePaymentPollers';
import type { Currency } from '@proton/payments/core/interface';
import { CacheType } from '@proton/redux-utilities/interface';
import { APPS } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

import { TopUpModal, type TopUpModalProps } from './TopUpModal';

const getCurrenciesI18N = (): Record<Currency, string> => ({
    EUR: c('Monetary unit').t`Euro`,
    CHF: c('Monetary unit').t`Swiss franc`,
    USD: c('Monetary unit').t`US Dollar`,
    BRL: c('Monetary unit').t`Brazilian real`,
    GBP: c('Monetary unit').t`British pound`,
    AUD: c('Monetary unit').t`Australian dollar`,
    CAD: c('Monetary unit').t`Canadian dollar`,
    JPY: c('Monetary unit').t`Japanese yen`,
    KRW: c('Monetary unit').t`South Korean won`,
    PLN: c('Monetary unit').t`Polish złoty`,
    SGD: c('Monetary unit').t`Singapore dollar`,
    HKD: c('Monetary unit').t`Hong Kong dollar`,
});

export const CreditsModal = (props: TopUpModalProps) => {
    const { APP_NAME } = useConfig();
    const { createNotification } = useNotifications();
    const { createCreditsPoller } = usePaymentPollers();
    const getPaymentMethods = useGetPaymentMethods();

    return (
        <TopUpModal
            {...props}
            title={c('Title').t`Add credits`}
            renderDescription={(currency) => {
                const i18nCurrency = getCurrenciesI18N()[currency];
                return (
                    <>
                        <div>
                            {c('Info')
                                .jt`Top up your account with credits that you can use to subscribe to a new plan or renew your current plan. You get one credit for every ${i18nCurrency} spent.`}
                        </div>
                        <Href
                            href={
                                APP_NAME === APPS.PROTONVPN_SETTINGS
                                    ? 'https://protonvpn.com/support/vpn-credit-proration/'
                                    : getKnowledgeBaseUrl('/credit-proration-coupons')
                            }
                        >
                            {c('Link').t`Learn more`}
                        </Href>
                    </>
                );
            }}
            sentryComponent="credits-modal"
            onTopUp={async (operations, data) => {
                const pollCredits = createCreditsPoller();
                await operations.buyCredit();

                if (data.sourceType === 'chargebee-bitcoin') {
                    createNotification({
                        text: c('Payments')
                            .t`The transaction is successfully detected. The credits will be added to your account once the transaction is fully confirmed.`,
                        expiration: 20000,
                    });
                } else {
                    try {
                        await pollCredits();
                    } catch {}
                    // Might have used this to add a payment method, so let's refetch them.
                    await getPaymentMethods({ cache: CacheType.None });

                    createNotification({ text: c('Success').t`Credits added` });
                }
            }}
        />
    );
};
