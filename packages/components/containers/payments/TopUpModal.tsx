import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';

import { c } from 'ttag';

import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import { useConfig } from '@proton/app-context/useConfig';
import { Button } from '@proton/atoms/Button/Button';
import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import useLoading from '@proton/hooks/useLoading';
import { useAutomaticCurrency } from '@proton/payments-ui/client-extensions/useAutomaticCurrency';
import type { OnChargeable } from '@proton/payments-ui/client-extensions/usePaymentFacade';
import { usePaymentFacade } from '@proton/payments-ui/client-extensions/usePaymentFacade';
import { ChargebeeIdealButton } from '@proton/payments-ui/ui/components/ChargebeeIdealButton';
import { ChargebeePaypalButton } from '@proton/payments-ui/ui/components/ChargebeePaypalButton';
import {
    IdealAuthorizationText,
    isIdealAuthorizationNoteShown,
} from '@proton/payments-ui/ui/components/IdealAuthorizationText';
import { getMaxBitcoinAmount, getMinBitcoinAmount, getMinCreditAmount } from '@proton/payments/core/amount-limits';
import { PAYMENT_METHOD_TYPES } from '@proton/payments/core/constants';
import type { Currency, PaymentStatus, PlainPaymentMethodType } from '@proton/payments/core/interface';
import type { PaymentProcessorHook } from '@proton/payments/core/payment-processors/interface';
import { isFreeSubscription } from '@proton/payments/core/type-guards';
import type { PaymentsComponent } from '@proton/payments/sentry/capture';
import { tracePaymentError } from '@proton/payments/sentry/capture';
import type { APP_NAMES } from '@proton/shared/lib/constants';

import Form from '../../components/form/Form';
import useDebounceInput from '../../components/input/useDebounceInput';
import Loader from '../../components/loader/Loader';
import type { ModalProps } from '../../components/modalTwo/Modal';
import ModalTwo from '../../components/modalTwo/Modal';
import ModalTwoContent from '../../components/modalTwo/ModalContent';
import ModalTwoFooter from '../../components/modalTwo/ModalFooter';
import ModalTwoHeader from '../../components/modalTwo/ModalHeader';
import Price from '../../components/price/Price';
import AmountRow from './AmountRow';
import PaymentInfo from './PaymentInfo';
import PaymentWrapper from './PaymentWrapper';

export type TopUpModalProps = {
    app: APP_NAMES;
    paymentStatus: PaymentStatus;
} & ModalProps;

type Props = {
    title: string;
    renderDescription: (currency: Currency) => ReactNode;
    sentryComponent: PaymentsComponent;
    onTopUp: OnChargeable;
    initialCurrency?: Currency;
    excludedMethods?: PlainPaymentMethodType[];
} & TopUpModalProps;

const DEFAULT_TOP_UP_AMOUNT = 5000;

const nonChargeableMethods = new Set<PlainPaymentMethodType | undefined>([
    PAYMENT_METHOD_TYPES.CHARGEBEE_BITCOIN,
    PAYMENT_METHOD_TYPES.CASH,
]);

export const TopUpModal = ({
    paymentStatus,
    app,
    title,
    renderDescription,
    sentryComponent,
    onTopUp,
    initialCurrency,
    excludedMethods = [],
    ...props
}: Props) => {
    const { APP_NAME } = useConfig();
    const [loading, withLoading] = useLoading();

    const [preferredCurrency] = useAutomaticCurrency();
    const [currency, setCurrency] = useState<Currency>(initialCurrency ?? preferredCurrency);
    const [amount, setAmount] = useState(DEFAULT_TOP_UP_AMOUNT);
    const debouncedAmount = useDebounceInput(amount);
    const amountLoading = debouncedAmount !== amount;
    const [subscription, loadingSubscription] = useSubscription();
    const [user, loadingUser] = useUser();

    const { CountryCode, State } = paymentStatus;
    const billingAddress = useMemo(() => ({ CountryCode, State }), [CountryCode, State]);

    const paymentFacade = usePaymentFacade({
        amount: debouncedAmount,
        currency,
        paymentStatus,
        billingAddress,
        onChargeable: (operations, data) => {
            const run = async () => {
                await onTopUp(operations, data);
                props.onClose?.();
            };

            return withLoading(run());
        },
        flow: 'credit',
        user,
        product: app,
        telemetryContext: 'other',
        sortNewMethods: (methods) =>
            methods.filter(({ type }) => !excludedMethods.includes(type as PlainPaymentMethodType)),
    });

    if (loadingSubscription || loadingUser) {
        return <Loader />;
    }

    const methodValue = paymentFacade.selectedMethodValue;

    const minCreditAmount = getMinCreditAmount(currency);
    const lowAmount = debouncedAmount < minCreditAmount;

    const submit = (() => {
        const bitcoinAmountInRange =
            debouncedAmount >= getMinBitcoinAmount(currency) && debouncedAmount <= getMaxBitcoinAmount(currency);
        if (methodValue === PAYMENT_METHOD_TYPES.CHARGEBEE_BITCOIN && !bitcoinAmountInRange) {
            return null;
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

        if (methodValue === PAYMENT_METHOD_TYPES.CHARGEBEE_IDEAL) {
            if (loading) {
                return (
                    <ButtonLike disabled loading={true}>
                        {c('Payments').t`Processing payment`}
                    </ButtonLike>
                );
            }

            return (
                <div>
                    <ChargebeeIdealButton
                        chargebeeIdeal={paymentFacade.chargebeeIdeal}
                        iframeHandles={paymentFacade.iframeHandles}
                    />
                </div>
            );
        }

        const topUpText = c('Action').t`Top up`;
        if (methodValue === PAYMENT_METHOD_TYPES.CHARGEBEE_BITCOIN) {
            return (
                <Button
                    color="norm"
                    loading={paymentFacade.bitcoinChargebee.bitcoinLoading}
                    disabled={true}
                    data-testid="top-up-button"
                >
                    {paymentFacade.bitcoinChargebee.awaitingBitcoinPayment
                        ? c('Info').t`Awaiting transaction`
                        : topUpText}
                </Button>
            );
        }

        return (
            <Button
                color="norm"
                loading={loading}
                disabled={paymentFacade.methods.loading || amountLoading || lowAmount}
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
                tracePaymentError(e, {
                    component: sentryComponent,
                    subscription,
                    extra: {
                        app: APP_NAME,
                        currency,
                        amount,
                        debouncedAmount,
                        processorType: paymentFacade.selectedProcessor?.meta.type,
                        paymentMethod: paymentFacade.selectedMethodType,
                        paymentMethodValue: paymentFacade.selectedMethodValue,
                    },
                });
            }
        });

    const disableCurrencySelector = !isFreeSubscription(subscription);

    const amountToCharge =
        amountLoading || nonChargeableMethods.has(paymentFacade.selectedMethodType) || lowAmount ? null : (
            <Price currency={currency} key="amount-to-charge">
                {debouncedAmount}
            </Price>
        );

    return (
        <ModalTwo
            className="credits-modal"
            size="large"
            as={Form}
            onSubmit={() => process(paymentFacade.selectedProcessor)}
            {...props}
        >
            <ModalTwoHeader title={title} />
            <ModalTwoContent>
                <PaymentInfo paymentMethodType={paymentFacade.selectedMethodType} />
                <div className="mb-4">{renderDescription(currency)}</div>
                <AmountRow
                    paymentStatus={paymentStatus}
                    paymentMethodType={paymentFacade.selectedMethodType}
                    amount={amount}
                    onChangeAmount={setAmount}
                    currency={currency}
                    onChangeCurrency={setCurrency}
                    disableCurrencySelector={disableCurrencySelector}
                />
                <PaymentWrapper {...paymentFacade} noMaxWidth onCurrencyChange={setCurrency} />
                {amountToCharge && (
                    <p
                        className="text-sm text-center color-weak min-h-custom"
                        style={{
                            '--min-h-custom': '1.5rem',
                        }}
                        data-testid="amountToCharge-text"
                    >
                        {c('Payments').jt`You will be charged ${amountToCharge} from your selected payment method.`}
                    </p>
                )}
                {isIdealAuthorizationNoteShown(paymentFacade) && (
                    <div className="mt-4">
                        <IdealAuthorizationText />
                    </div>
                )}
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
