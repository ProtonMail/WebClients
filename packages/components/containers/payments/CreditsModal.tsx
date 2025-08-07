import { useState } from 'react';

import { c } from 'ttag';

import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import { Button, ButtonLike, Href } from '@proton/atoms';
import Form from '@proton/components/components/form/Form';
import useDebounceInput from '@proton/components/components/input/useDebounceInput';
import Loader from '@proton/components/components/loader/Loader';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import Price from '@proton/components/components/price/Price';
import useConfig from '@proton/components/hooks/useConfig';
import useEventManager from '@proton/components/hooks/useEventManager';
import useNotifications from '@proton/components/hooks/useNotifications';
import { useAutomaticCurrency, usePaymentFacade } from '@proton/components/payments/client-extensions';
import { useChargebeeContext } from '@proton/components/payments/client-extensions/useChargebeeContext';
import { usePollEvents } from '@proton/components/payments/client-extensions/usePollEvents';
import { useLoading } from '@proton/hooks';
import {
    type Currency,
    MAX_BITCOIN_AMOUNT,
    MIN_BITCOIN_AMOUNT,
    MIN_CREDIT_AMOUNT,
    PAYMENT_METHOD_TYPES,
    type PaymentProcessorHook,
    type PaymentStatus,
    type PlainPaymentMethodType,
    getPaymentsVersion,
    isFreeSubscription,
} from '@proton/payments';
import { ChargebeePaypalButton } from '@proton/payments/ui';
import { APPS } from '@proton/shared/lib/constants';
import { captureMessage } from '@proton/shared/lib/helpers/sentry';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import { ChargebeeEnabled } from '@proton/shared/lib/interfaces';
import { getSentryError } from '@proton/shared/lib/keys';
import noop from '@proton/utils/noop';

import AmountRow from './AmountRow';
import PaymentInfo from './PaymentInfo';
import PaymentWrapper from './PaymentWrapper';
import StyledPayPalButton from './StyledPayPalButton';

const getCurrenciesI18N = () => ({
    EUR: c('Monetary unit').t`Euro`,
    CHF: c('Monetary unit').t`Swiss franc`,
    USD: c('Monetary unit').t`US Dollar`,
    BRL: c('Monetary unit').t`Brazilian real`,
    GBP: c('Monetary unit').t`British pound`,
    AUD: c('Monetary unit').t`Australian dollar`,
    CAD: c('Monetary unit').t`Canadian dollar`,
});

type Props = {
    paymentStatus: PaymentStatus;
} & ModalProps;

export const DEFAULT_CREDITS_AMOUNT = 5000;

const nonChargeableMethods = new Set<PlainPaymentMethodType | undefined>([
    PAYMENT_METHOD_TYPES.BITCOIN,
    PAYMENT_METHOD_TYPES.CHARGEBEE_BITCOIN,
    PAYMENT_METHOD_TYPES.CASH,
]);

const CreditsModal = ({ paymentStatus, ...props }: Props) => {
    const { APP_NAME } = useConfig();
    const { call } = useEventManager();
    const { createNotification } = useNotifications();
    const [loading, withLoading] = useLoading();

    const [preferredCurrency] = useAutomaticCurrency();
    const [currency, setCurrency] = useState<Currency>(preferredCurrency);
    const [amount, setAmount] = useState(DEFAULT_CREDITS_AMOUNT);
    const debouncedAmount = useDebounceInput(amount);
    const amountLoading = debouncedAmount !== amount;
    const i18n = getCurrenciesI18N();
    const i18nCurrency = i18n[currency];
    const pollEventsMultipleTimes = usePollEvents();
    const chargebeeContext = useChargebeeContext();
    const [subscription, loadingSubscription] = useSubscription();
    const [user, loadingUser] = useUser();

    const paymentFacade = usePaymentFacade({
        amount: debouncedAmount,
        currency,
        billingPlatform: subscription?.BillingPlatform,
        chargebeeUserExists: user.ChargebeeUserExists,
        paymentStatus,
        onChargeable: (operations, data) => {
            const run = async () => {
                await operations.buyCredit();
                await call();
                props.onClose?.();

                if (data.sourceType === 'chargebee-bitcoin') {
                    createNotification({
                        text: c('Payments')
                            .t`The transaction is successfully detected. The credits will be added to your account once the transaction is fully confirmed.`,
                        expiration: 20000,
                    });
                } else {
                    createNotification({ text: c('Success').t`Credits added` });
                }
            };

            const promise = run();
            void withLoading(promise);

            promise.then(() => pollEventsMultipleTimes()).catch(noop);

            return promise;
        },
        flow: 'credit',
        user,
    });

    if (loadingSubscription || loadingUser) {
        return <Loader />;
    }

    const methodValue = paymentFacade.selectedMethodValue;

    const submit = (() => {
        const bitcoinAmountInRange = debouncedAmount >= MIN_BITCOIN_AMOUNT && debouncedAmount <= MAX_BITCOIN_AMOUNT;
        if (
            debouncedAmount < MIN_CREDIT_AMOUNT ||
            ((methodValue === PAYMENT_METHOD_TYPES.BITCOIN || methodValue === PAYMENT_METHOD_TYPES.CHARGEBEE_BITCOIN) &&
                !bitcoinAmountInRange)
        ) {
            return null;
        }

        if (paymentFacade.methods.isNewPaypal) {
            return (
                <StyledPayPalButton
                    type="submit"
                    paypal={paymentFacade.paypal}
                    loading={loading}
                    disabled={amountLoading}
                    data-testid="paypal-button"
                />
            );
        }

        if (methodValue === PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL) {
            if (loading) {
                return (
                    <ButtonLike disabled loading={true}>
                        {c('Payments').t`Processing payment`}
                    </ButtonLike>
                );
            }

            return (
                <div>
                    <ChargebeePaypalButton
                        chargebeePaypal={paymentFacade.chargebeePaypal}
                        iframeHandles={paymentFacade.iframeHandles}
                    />
                </div>
            );
        }

        const topUpText = c('Action').t`Top up`;
        if (methodValue === PAYMENT_METHOD_TYPES.BITCOIN || methodValue === PAYMENT_METHOD_TYPES.CHARGEBEE_BITCOIN) {
            return (
                <Button
                    color="norm"
                    loading={
                        paymentFacade.bitcoinInhouse.bitcoinLoading || paymentFacade.bitcoinChargebee.bitcoinLoading
                    }
                    disabled={true}
                    data-testid="top-up-button"
                >
                    {paymentFacade.bitcoinInhouse.awaitingBitcoinPayment ||
                    paymentFacade.bitcoinChargebee.awaitingBitcoinPayment
                        ? c('Info').t`Awaiting transaction`
                        : topUpText}
                </Button>
            );
        }

        return (
            <Button
                color="norm"
                loading={loading}
                disabled={paymentFacade.methods.loading || !paymentFacade.userCanTriggerSelected || amountLoading}
                type="submit"
                data-testid="top-up-button"
            >
                {topUpText}
            </Button>
        );
    })();

    const process = async (processor?: PaymentProcessorHook) =>
        withLoading(async () => {
            if (!processor) {
                return;
            }

            try {
                await processor.processPaymentToken();
            } catch (e) {
                const error = getSentryError(e);
                if (error) {
                    const context = {
                        app: APP_NAME,
                        currency,
                        amount,
                        debouncedAmount,
                        processorType: paymentFacade.selectedProcessor?.meta.type,
                        paymentMethod: paymentFacade.selectedMethodType,
                        paymentMethodValue: paymentFacade.selectedMethodValue,
                        paymentsVersion: getPaymentsVersion(),
                        chargebeeEnabled: chargebeeContext.enableChargebeeRef.current,
                    };

                    captureMessage('Payments: failed to handle credits', {
                        level: 'error',
                        extra: { error, context },
                    });
                }
            }
        });

    const disableCurrencySelector =
        chargebeeContext.enableChargebeeRef.current !== ChargebeeEnabled.INHOUSE_FORCED &&
        !isFreeSubscription(subscription);

    const amountToCharge =
        amountLoading || nonChargeableMethods.has(paymentFacade.selectedMethodType) ? null : (
            <Price currency={currency}>{debouncedAmount}</Price>
        );

    return (
        <ModalTwo
            className="credits-modal"
            size="large"
            as={Form}
            onSubmit={() => process(paymentFacade.selectedProcessor)}
            {...props}
        >
            <ModalTwoHeader title={c('Title').t`Add credits`} />
            <ModalTwoContent>
                <PaymentInfo paymentMethodType={paymentFacade.selectedMethodType} />
                <div className="mb-4">
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
                </div>
                <AmountRow
                    paymentStatus={paymentStatus}
                    paymentMethodType={paymentFacade.selectedMethodType}
                    amount={amount}
                    onChangeAmount={setAmount}
                    currency={currency}
                    onChangeCurrency={setCurrency}
                    disableCurrencySelector={disableCurrencySelector}
                />
                <PaymentWrapper {...paymentFacade} noMaxWidth />
                <p
                    className="text-sm text-center color-weak min-h-custom"
                    style={{
                        '--min-h-custom': '1.5rem',
                    }}
                >
                    {amountToCharge
                        ? c('Payments').jt`You will be charged ${amountToCharge} from your selected payment method.`
                        : null}
                </p>
            </ModalTwoContent>

            <ModalTwoFooter>
                <div className="w-full flex justify-space-between">
                    <Button onClick={props.onClose}>{c('Action').t`Close`}</Button>
                    {submit}
                </div>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default CreditsModal;
