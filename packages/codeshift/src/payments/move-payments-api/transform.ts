import type { API, FileInfo, Options } from 'jscodeshift';

import moveLiteral, { type ImportConfig } from '../move-literal';

function transform(fileInfo: FileInfo, api: API, options: Options) {
    const config: ImportConfig[] = [
        {
            identifier: 'FeedbackDowngradeData',
            source: '@proton/shared/lib/api/payments',
            target: '@proton/payments',
        },
        {
            identifier: 'setPaymentsVersion',
            source: '@proton/shared/lib/api/payments',
            target: '@proton/payments',
        },
        {
            identifier: 'getPaymentsVersion',
            source: '@proton/shared/lib/api/payments',
            target: '@proton/payments',
        },
        {
            identifier: 'PaymentsVersion',
            source: '@proton/shared/lib/api/payments',
            target: '@proton/payments',
        },
        {
            identifier: 'queryFreePlan',
            source: '@proton/shared/lib/api/payments',
            target: '@proton/payments',
        },
        {
            identifier: 'getFreePlan',
            source: '@proton/shared/lib/api/payments',
            target: '@proton/payments',
        },
        {
            identifier: 'getSubscription',
            source: '@proton/shared/lib/api/payments',
            target: '@proton/payments',
        },
        {
            identifier: 'FeedbackDowngradeData',
            source: '@proton/shared/lib/api/payments',
            target: '@proton/payments',
        },
        {
            identifier: 'deleteSubscription',
            source: '@proton/shared/lib/api/payments',
            target: '@proton/payments',
        },
        {
            identifier: 'ProrationMode',
            source: '@proton/shared/lib/api/payments',
            target: '@proton/payments',
        },
        {
            identifier: 'CheckSubscriptionData',
            source: '@proton/shared/lib/api/payments',
            target: '@proton/payments',
        },
        {
            identifier: 'SubscribeData',
            source: '@proton/shared/lib/api/payments',
            target: '@proton/payments',
        },
        {
            identifier: 'isCommonSubscribeData',
            source: '@proton/shared/lib/api/payments',
            target: '@proton/payments',
        },
        {
            identifier: 'isSubscribeDataV4',
            source: '@proton/shared/lib/api/payments',
            target: '@proton/payments',
        },
        {
            identifier: 'isSubscribeDataV5',
            source: '@proton/shared/lib/api/payments',
            target: '@proton/payments',
        },
        {
            identifier: 'isSubscribeDataNoPayment',
            source: '@proton/shared/lib/api/payments',
            target: '@proton/payments',
        },
        {
            identifier: 'isSubscribeData',
            source: '@proton/shared/lib/api/payments',
            target: '@proton/payments',
        },
        {
            identifier: 'getLifetimeProductType',
            source: '@proton/shared/lib/api/payments',
            target: '@proton/payments',
        },
        {
            identifier: 'buyProduct',
            source: '@proton/shared/lib/api/payments',
            target: '@proton/payments',
        },
        {
            identifier: 'subscribe',
            source: '@proton/shared/lib/api/payments',
            target: '@proton/payments',
        },
        {
            identifier: 'InvoiceDocument',
            source: '@proton/shared/lib/api/payments',
            target: '@proton/payments',
        },
        {
            identifier: 'QueryInvoicesParams',
            source: '@proton/shared/lib/api/payments',
            target: '@proton/payments',
        },
        {
            identifier: 'queryInvoices',
            source: '@proton/shared/lib/api/payments',
            target: '@proton/payments',
        },
        {
            identifier: 'QueryPlansParams',
            source: '@proton/shared/lib/api/payments',
            target: '@proton/payments',
        },
        {
            identifier: 'queryPlans',
            source: '@proton/shared/lib/api/payments',
            target: '@proton/payments',
        },
        {
            identifier: 'getInvoicePDF',
            source: '@proton/shared/lib/api/payments',
            target: '@proton/payments',
        },
        {
            identifier: 'getTransactionPDF',
            source: '@proton/shared/lib/api/payments',
            target: '@proton/payments',
        },
        {
            identifier: 'checkInvoice',
            source: '@proton/shared/lib/api/payments',
            target: '@proton/payments',
        },
        {
            identifier: 'queryPaymentMethods',
            source: '@proton/shared/lib/api/payments',
            target: '@proton/payments',
        },
        {
            identifier: 'SetPaymentMethodDataV4',
            source: '@proton/shared/lib/api/payments',
            target: '@proton/payments',
        },
        {
            identifier: 'setPaymentMethodV4',
            source: '@proton/shared/lib/api/payments',
            target: '@proton/payments',
        },
        {
            identifier: 'SetPaymentMethodDataV5',
            source: '@proton/shared/lib/api/payments',
            target: '@proton/payments',
        },
        {
            identifier: 'setPaymentMethodV5',
            source: '@proton/shared/lib/api/payments',
            target: '@proton/payments',
        },
        {
            identifier: 'UpdatePaymentMethodsData',
            source: '@proton/shared/lib/api/payments',
            target: '@proton/payments',
        },
        {
            identifier: 'updatePaymentMethod',
            source: '@proton/shared/lib/api/payments',
            target: '@proton/payments',
        },
        {
            identifier: 'deletePaymentMethod',
            source: '@proton/shared/lib/api/payments',
            target: '@proton/payments',
        },
        {
            identifier: 'payInvoice',
            source: '@proton/shared/lib/api/payments',
            target: '@proton/payments',
        },
        {
            identifier: 'orderPaymentMethods',
            source: '@proton/shared/lib/api/payments',
            target: '@proton/payments',
        },
        {
            identifier: 'GiftCodeData',
            source: '@proton/shared/lib/api/payments',
            target: '@proton/payments',
        },
        {
            identifier: 'buyCredit',
            source: '@proton/shared/lib/api/payments',
            target: '@proton/payments',
        },
        {
            identifier: 'ValidateCreditData',
            source: '@proton/shared/lib/api/payments',
            target: '@proton/payments',
        },
        {
            identifier: 'validateCredit',
            source: '@proton/shared/lib/api/payments',
            target: '@proton/payments',
        },
        {
            identifier: 'CreateBitcoinTokenData',
            source: '@proton/shared/lib/api/payments',
            target: '@proton/payments',
        },
        {
            identifier: 'CreateTokenData',
            source: '@proton/shared/lib/api/payments',
            target: '@proton/payments',
        },
        {
            identifier: 'createToken',
            source: '@proton/shared/lib/api/payments',
            target: '@proton/payments',
        },
        {
            identifier: 'createTokenV4',
            source: '@proton/shared/lib/api/payments',
            target: '@proton/payments',
        },
        {
            identifier: 'createTokenV5',
            source: '@proton/shared/lib/api/payments',
            target: '@proton/payments',
        },
        {
            identifier: 'getTokenStatus',
            source: '@proton/shared/lib/api/payments',
            target: '@proton/payments',
        },
        {
            identifier: 'getTokenStatusV4',
            source: '@proton/shared/lib/api/payments',
            target: '@proton/payments',
        },
        {
            identifier: 'getTokenStatusV5',
            source: '@proton/shared/lib/api/payments',
            target: '@proton/payments',
        },
        {
            identifier: 'getLastCancelledSubscription',
            source: '@proton/shared/lib/api/payments',
            target: '@proton/payments',
        },
        {
            identifier: 'RenewalStateData',
            source: '@proton/shared/lib/api/payments',
            target: '@proton/payments',
        },
        {
            identifier: 'changeRenewState',
            source: '@proton/shared/lib/api/payments',
            target: '@proton/payments',
        },
        {
            identifier: 'SubscribeV5Data',
            source: '@proton/shared/lib/api/payments',
            target: '@proton/payments',
        },
        {
            identifier: 'CreatePaymentIntentPaypalData',
            source: '@proton/shared/lib/api/payments',
            target: '@proton/payments',
        },
        {
            identifier: 'CreatePaymentIntentCardData',
            source: '@proton/shared/lib/api/payments',
            target: '@proton/payments',
        },
        {
            identifier: 'CreatePaymentIntentSavedCardData',
            source: '@proton/shared/lib/api/payments',
            target: '@proton/payments',
        },
        {
            identifier: 'CreatePaymentIntentDirectDebitData',
            source: '@proton/shared/lib/api/payments',
            target: '@proton/payments',
        },
        {
            identifier: 'CreatePaymentIntentData',
            source: '@proton/shared/lib/api/payments',
            target: '@proton/payments',
        },
        {
            identifier: 'createPaymentIntentV5',
            source: '@proton/shared/lib/api/payments',
            target: '@proton/payments',
        },
        {
            identifier: 'BackendPaymentIntent',
            source: '@proton/shared/lib/api/payments',
            target: '@proton/payments',
        },
        {
            identifier: 'FetchPaymentIntentV5Response',
            source: '@proton/shared/lib/api/payments',
            target: '@proton/payments',
        },
        {
            identifier: 'fetchPaymentIntentV5',
            source: '@proton/shared/lib/api/payments',
            target: '@proton/payments',
        },
        {
            identifier: 'FetchPaymentIntentForExistingV5Response',
            source: '@proton/shared/lib/api/payments',
            target: '@proton/payments',
        },
        {
            identifier: 'fetchPaymentIntentForExistingV5',
            source: '@proton/shared/lib/api/payments',
            target: '@proton/payments',
        },
        {
            identifier: 'GetChargebeeConfigurationResponse',
            source: '@proton/shared/lib/api/payments',
            target: '@proton/payments',
        },
        {
            identifier: 'getChargebeeConfiguration',
            source: '@proton/shared/lib/api/payments',
            target: '@proton/payments',
        },
        {
            identifier: 'queryTransactions',
            source: '@proton/shared/lib/api/payments',
            target: '@proton/payments',
        },
        {
            identifier: 'QueryTransactionsParams',
            source: '@proton/shared/lib/api/payments',
            target: '@proton/payments',
        },
        {
            identifier: 'getPlanNameFromIDs',
            source: '@proton/shared/lib/helpers/planIDs',
            target: '@proton/payments',
        },
        {
            identifier: 'isLifetimePlanSelected',
            source: '@proton/shared/lib/helpers/planIDs',
            target: '@proton/payments',
        },
    ];

    return moveLiteral(fileInfo, api, config, options);
}

transform.parser = 'tsx';

export default transform;
