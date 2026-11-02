import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';

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
import { formatTax } from '@proton/payments-ui/ui/headless-checkout/tax-helpers';
import { getMaxBitcoinAmount, getMinBitcoinAmount, getMinCreditAmount } from '@proton/payments/core/amount-limits';
import type { ProductCheckResponse } from '@proton/payments/core/api/createPaymentSubscription';
import { PAYMENT_METHOD_TYPES } from '@proton/payments/core/constants';
import type {
    Currency,
    PaymentMethodFlow,
    PaymentStatus,
    PlainPaymentMethodType,
} from '@proton/payments/core/interface';
import type { PaymentProcessorHook } from '@proton/payments/core/payment-processors/interface';
import { isFreeSubscription } from '@proton/payments/core/type-guards';
import type { PaymentsComponent } from '@proton/payments/sentry/capture';
import { tracePaymentError } from '@proton/payments/sentry/capture';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { TaxMode } from '@proton/shared/lib/payments/subscription/constants';

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
import CheckoutRow from './subscription/modal-components/helpers/CheckoutRow';

export type TopUpModalProps = {
    app: APP_NAMES;
    paymentStatus: PaymentStatus;
} & ModalProps;

type Props = {
    title: string;
    renderDescription: (currency: Currency) => ReactNode;
    sentryComponent: PaymentsComponent;
    onTopUp: (...args: [...Parameters<OnChargeable>, credits: number]) => ReturnType<OnChargeable>;
    initialCurrency?: Currency;
    flow?: Extract<PaymentMethodFlow, 'credit' | 'lumo-credit'>;
    minAmount?: number;
    checkTopUp?: (amount: number, currency: Currency) => Promise<ProductCheckResponse>;
    onTopUpFromAccountCredit?: (credits: number, currency: Currency) => Promise<void>;
} & TopUpModalProps;

type CheckedTopUp = {
    amount: number;
    currency: Currency;
    result: ProductCheckResponse | undefined;
};

const getAuthorizedCredits = (
    check: CheckedTopUp | undefined,
    { Amount, Currency }: { Amount: number; Currency: Currency }
) => (check?.result?.Currency === Currency && check.result.AmountDue === Amount ? check.amount : undefined);

const isPaidByAccountCredit = (check: ProductCheckResponse | undefined) => check?.AmountDue === 0;

const TopUpSummary = ({ check }: { check: ProductCheckResponse }) => {
    const tax = formatTax({
        Taxes: check.Taxes,
        TaxMode: check.TaxInclusive ? TaxMode.INCLUSIVE : TaxMode.EXCLUSIVE,
        Currency: check.Currency,
    });

    return (
        <div className="mb-4" data-testid="top-up-summary">
            <CheckoutRow title={c('Label').t`Credits`} amount={check.Amount} currency={check.Currency} />
            {tax && <CheckoutRow title={tax.taxRateElement} amount={tax.amount} currency={check.Currency} />}
            <CheckoutRow
                className="text-bold"
                title={c('Label').t`Total`}
                amount={check.AmountDue}
                currency={check.Currency}
                data-testid="top-up-total"
            />
        </div>
    );
};

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
    flow = 'credit',
    minAmount: minAmountProp,
    checkTopUp,
    onTopUpFromAccountCredit,
    ...props
}: Props) => {
    const { APP_NAME } = useConfig();
    const [loading, withLoading] = useLoading();

    const [preferredCurrency] = useAutomaticCurrency();
    const [currency, setCurrency] = useState<Currency>(initialCurrency ?? preferredCurrency);
    const [amount, setAmount] = useState(DEFAULT_TOP_UP_AMOUNT);
    const debouncedAmount = useDebounceInput(amount);
    const [latestCheck, setLatestCheck] = useState<CheckedTopUp>();
    const [subscription, loadingSubscription] = useSubscription();
    const [user, loadingUser] = useUser();

    const { CountryCode, State } = paymentStatus;
    const billingAddress = useMemo(() => ({ CountryCode, State }), [CountryCode, State]);

    const minAmount = minAmountProp ?? getMinCreditAmount(currency);
    const lowAmount = debouncedAmount < minAmount;

    useEffect(() => {
        if (!checkTopUp || lowAmount) {
            return;
        }

        let isLatestCheck = true;
        const storeCheck = (result: ProductCheckResponse | undefined) => {
            if (isLatestCheck) {
                setLatestCheck({ amount: debouncedAmount, currency, result });
            }
        };
        checkTopUp(debouncedAmount, currency).then(storeCheck, () => storeCheck(undefined));

        return () => {
            isLatestCheck = false;
        };
    }, [debouncedAmount, currency, lowAmount]);

    const checkOfCurrentAmount =
        latestCheck?.amount === debouncedAmount && latestCheck.currency === currency ? latestCheck : undefined;
    const currentCheck = checkOfCurrentAmount?.result;
    const checkFailed = !!checkOfCurrentAmount && !currentCheck;
    const checkLoading = !!checkTopUp && !lowAmount && !checkOfCurrentAmount;
    const amountDueUnknown = checkLoading || checkFailed;
    const amountToChargeUnknown = debouncedAmount !== amount || amountDueUnknown;
    const amountDue = currentCheck?.AmountDue ?? debouncedAmount;
    const paidByAccountCredit = !!onTopUpFromAccountCredit && isPaidByAccountCredit(currentCheck);

    const paymentFacade = usePaymentFacade({
        amount: amountDue,
        currency,
        paymentStatus,
        billingAddress,
        onChargeable: (operations, data) => {
            const { Amount, Currency } = data.chargeablePaymentParameters;
            const authorizedCredits = checkTopUp
                ? getAuthorizedCredits(checkOfCurrentAmount, { Amount, Currency })
                : Amount;
            const run = async () => {
                if (authorizedCredits === undefined) {
                    throw new Error('The authorized amount does not match the checked top-up');
                }
                await onTopUp(operations, data, authorizedCredits);
                props.onClose?.();
            };

            return withLoading(run());
        },
        flow,
        user,
        product: app,
        telemetryContext: 'other',
    });

    if (loadingSubscription || loadingUser) {
        return <Loader />;
    }

    const methodValue = paymentFacade.selectedMethodValue;

    const submit = (() => {
        if (paidByAccountCredit) {
            return (
                <Button
                    color="norm"
                    loading={loading}
                    disabled={amountToChargeUnknown}
                    type="submit"
                    data-testid="top-up-button"
                >
                    {c('Action').t`Top up`}
                </Button>
            );
        }

        const bitcoinAmountInRange =
            debouncedAmount >= getMinBitcoinAmount(currency) && debouncedAmount <= getMaxBitcoinAmount(currency);
        if (methodValue === PAYMENT_METHOD_TYPES.CHARGEBEE_BITCOIN && !bitcoinAmountInRange) {
            return null;
        }

        const topUpText = c('Action').t`Top up`;
        if (methodValue === PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL) {
            if (loading) {
                return (
                    <ButtonLike disabled loading={true}>
                        {c('Payments').t`Processing payment`}
                    </ButtonLike>
                );
            }

            if (amountDueUnknown || (checkTopUp && lowAmount)) {
                return (
                    <ButtonLike disabled loading={checkLoading} data-testid="top-up-button">
                        {topUpText}
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
                disabled={paymentFacade.methods.loading || amountToChargeUnknown || lowAmount}
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
        amountToChargeUnknown || nonChargeableMethods.has(paymentFacade.selectedMethodType) || lowAmount ? null : (
            <Price currency={currency} key="amount-to-charge">
                {amountDue}
            </Price>
        );

    return (
        <ModalTwo
            className="credits-modal"
            size="large"
            as={Form}
            onSubmit={() =>
                paidByAccountCredit && checkOfCurrentAmount
                    ? withLoading(
                          onTopUpFromAccountCredit(checkOfCurrentAmount.amount, checkOfCurrentAmount.currency).then(
                              () => props.onClose?.()
                          )
                      )
                    : process(paymentFacade.selectedProcessor)
            }
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
                {currentCheck && <TopUpSummary check={currentCheck} />}
                {checkFailed && (
                    <p className="color-danger mt-0 mb-4" data-testid="top-up-check-error">
                        {c('Error').t`The total could not be calculated. Change the amount to try again.`}
                    </p>
                )}
                {paidByAccountCredit ? (
                    <p className="text-sm text-center color-weak" data-testid="paid-by-account-credit-text">
                        {c('Payments').t`Paid from your account credit.`}
                    </p>
                ) : (
                    <PaymentWrapper {...paymentFacade} noMaxWidth minCreditAmount={lowAmount ? minAmount : 0} />
                )}
                {!paidByAccountCredit && amountToCharge && (
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
