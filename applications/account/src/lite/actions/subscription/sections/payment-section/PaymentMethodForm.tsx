import type { PropsWithChildren } from 'react';

import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { Banner, BannerVariants } from '@proton/atoms/Banner/Banner';
import { Badge } from '@proton/components/components/badge/Badge';
import Price from '@proton/components/components/price/Price';
import Alert3DS from '@proton/components/containers/payments/Alert3ds';
import DefaultPaymentMethodMessage from '@proton/components/containers/payments/DefaultPaymentMethodMessage';
import PayPalInfoMessage from '@proton/components/containers/payments/PayPalInfoMessage';
import PayPalView from '@proton/components/containers/payments/PayPalView';
import Bitcoin from '@proton/components/containers/payments/bitcoin/Bitcoin';
import BitcoinInfoMessage from '@proton/components/containers/payments/bitcoin/BitcoinInfoMessage';
import PaymentMethodDetails from '@proton/components/containers/payments/methods/PaymentMethodDetails';
import { NoPaymentRequiredNote } from '@proton/components/containers/payments/subscription/modal-components/NoPaymentRequiredNote';
import useAuthentication from '@proton/components/hooks/useAuthentication';
import { type DirectDebitProps, SepaDirectDebit } from '@proton/components/payments/chargebee/SepaDirectDebit';
import type { usePaymentFacade } from '@proton/components/payments/client-extensions';
import { BilledUserInlineMessage } from '@proton/components/payments/client-extensions/billed-user';
import { useStableLoading } from '@proton/hooks/index';
import { IcArrowOutFromRectangle } from '@proton/icons/icons/IcArrowOutFromRectangle';
import { IcBagPercent } from '@proton/icons/icons/IcBagPercent';
import type { Currency } from '@proton/payments';
import { PAYMENT_METHOD_TYPES, savedMethodRequires3DS } from '@proton/payments';
import type { useTaxCountry, useVatNumber } from '@proton/payments/ui';
import {
    type ChargebeeCardWrapperProps,
    ChargebeeCreditCardWrapper,
    type ChargebeePaypalButtonProps,
    ChargebeeSavedCardWrapper,
} from '@proton/payments/ui';
import { TaxFields } from '@proton/payments/ui/components/TaxFields';
import { usePayments } from '@proton/payments/ui/context/PaymentContext';
import { isBilledUser } from '@proton/shared/lib/interfaces';

interface AmountProps {
    amount: number | undefined;
    currency: Currency;
}
const DiscountBadge = ({ currency, amount }: AmountProps) => {
    if (amount) {
        const positiveAmount = amount < 0 ? amount * -1 : amount;
        const discountAmount = amount ? (
            <Price currency={currency} key="discounted-amount">
                {positiveAmount}
            </Price>
        ) : null;
        return (
            <Badge type="success" className="flex gap-2 items-center">
                <IcBagPercent />
                <span>{c('Info').jt`You saved ${discountAmount} with an offer`}</span>
            </Badge>
        );
    }
};

const TotalAmount = ({ currency, amount }: AmountProps) => {
    if (amount) {
        const totalPrice = (
            <Price className="text-semibold" currency={currency} key={'total-price'}>
                {amount}
            </Price>
        );
        return <div>{c('Info').jt`Total: ${totalPrice}`}</div>;
    }
};

interface FooterTotalAmountProps {
    currency: Currency;
    discount: number | undefined;
    amountDue: number;
}

const TotalAmountWithDiscount = ({ amountDue, currency, discount }: FooterTotalAmountProps) => {
    return (
        <div className="flex flex-column items-center gap-3 my-4">
            <DiscountBadge currency={currency} amount={discount} />
            <TotalAmount currency={currency} amount={amountDue} />
        </div>
    );
};

interface Props {
    paymentFacade: ReturnType<typeof usePaymentFacade>;
    paymentMethodRequired: boolean;
    vatNumber: ReturnType<typeof useVatNumber>;
    taxCountry: ReturnType<typeof useTaxCountry>;
}

const PaymentMethodForm = ({
    paymentFacade,
    paymentMethodRequired,
    children,
    vatNumber,
    taxCountry,
}: PropsWithChildren<Props>) => {
    const [user] = useUser();
    const { UID } = useAuthentication();
    const { checkoutUi, subscription } = usePayments();
    const { couponDiscount, checkResult, discountPerCycle } = checkoutUi;
    const {
        selectedMethodValue,
        iframeHandles,
        chargebeeCard,
        chargebeePaypal,
        directDebit,
        themeCode,
        showTaxCountry,
        bitcoinChargebee,
        amount,
        currency,
        methods,
        flow,
        currencyOverride,
    } = paymentFacade;
    const sharedCbProps: Pick<
        ChargebeeCardWrapperProps & ChargebeePaypalButtonProps & DirectDebitProps,
        'iframeHandles' | 'chargebeePaypal' | 'chargebeeCard' | 'directDebit' | 'onInitialized'
    > = {
        iframeHandles,
        chargebeeCard,
        chargebeePaypal,
        directDebit,
    };

    const taxFields = (
        <TaxFields user={user} taxCountry={taxCountry} vatNumber={vatNumber} subscription={subscription} />
    );

    const { loading: loadingHookProps, ...bitcoinProps } = bitcoinChargebee;
    const loadingBitcoin = useStableLoading([loadingHookProps]);

    const savedMethod = methods.savedExternalSelectedMethod;

    const discountAmount = discountPerCycle || couponDiscount;
    if (paymentMethodRequired && selectedMethodValue) {
        return (
            <div className="mt-4">
                {selectedMethodValue === PAYMENT_METHOD_TYPES.CHARGEBEE_CARD && (
                    <>
                        <ChargebeeCreditCardWrapper
                            {...sharedCbProps}
                            themeCode={themeCode}
                            suffix={
                                <>
                                    {taxFields}
                                    <div className="flex flex-column items-center gap-3 my-4">
                                        <DiscountBadge amount={discountAmount} currency={currency} />
                                    </div>
                                </>
                            }
                            // if we don't let user select the tax country then we still need a fallback way to
                            // collect the card country and the postal code
                            showCountry={!showTaxCountry}
                        />
                        {children}
                        <Alert3DS />
                    </>
                )}
                {selectedMethodValue === PAYMENT_METHOD_TYPES.APPLE_PAY && (
                    <>
                        <div className="mt-2">{taxFields}</div>
                        <TotalAmountWithDiscount
                            amountDue={checkResult.AmountDue}
                            currency={currency}
                            discount={discountAmount}
                        />
                        {children}
                    </>
                )}
                {selectedMethodValue === PAYMENT_METHOD_TYPES.GOOGLE_PAY && (
                    <>
                        <div className="mt-2">{taxFields}</div>
                        <TotalAmountWithDiscount
                            amountDue={checkResult.AmountDue}
                            currency={currency}
                            discount={discountAmount}
                        />
                        {children}
                    </>
                )}
                {selectedMethodValue === PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT && (
                    <>
                        <TotalAmountWithDiscount
                            amountDue={checkResult.AmountDue}
                            currency={currency}
                            discount={discountAmount}
                        />
                        <SepaDirectDebit {...sharedCbProps} />

                        <div className="my-4">{taxFields}</div>
                        {children}
                    </>
                )}
                {!isBilledUser(user) && UID && selectedMethodValue === PAYMENT_METHOD_TYPES.CHARGEBEE_BITCOIN && (
                    <>
                        <BitcoinInfoMessage />
                        <Bitcoin
                            loading={loadingBitcoin || (!!taxCountry && !taxCountry.billingAddressValid)}
                            {...bitcoinProps}
                        />
                        <div className="mt-4">
                            {taxFields}
                            <TotalAmountWithDiscount
                                amountDue={checkResult.AmountDue}
                                currency={currency}
                                discount={discountAmount}
                            />
                        </div>
                        {children}
                    </>
                )}
                {isBilledUser(user) && UID && selectedMethodValue === PAYMENT_METHOD_TYPES.CHARGEBEE_BITCOIN && (
                    <>
                        <BilledUserInlineMessage />
                        {children}
                    </>
                )}
                {selectedMethodValue === PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL && (
                    <>
                        {taxFields}
                        <PayPalView method={selectedMethodValue} amount={amount} currency={currency}>
                            <div className="flex gap-2 items-center flex-nowrap mb-4">
                                <IcArrowOutFromRectangle className="color-weak shrink-0" size={8} />
                                <PayPalInfoMessage />
                            </div>
                        </PayPalView>
                        <TotalAmountWithDiscount
                            amountDue={checkResult.AmountDue}
                            currency={currency}
                            discount={discountAmount}
                        />
                        {children}
                    </>
                )}
                {savedMethod && (
                    <>
                        <PaymentMethodDetails type={savedMethod.Type} details={savedMethod.Details} />
                        {taxFields}
                        {savedMethod.Type === PAYMENT_METHOD_TYPES.CHARGEBEE_CARD ? (
                            <div className="flex flex-column items-center gap-3 my-4">
                                <DiscountBadge amount={discountAmount} currency={currency} />
                            </div>
                        ) : (
                            <TotalAmountWithDiscount
                                amountDue={checkResult.AmountDue}
                                currency={currency}
                                discount={discountAmount}
                            />
                        )}
                        {children}
                        {savedMethod.Type === PAYMENT_METHOD_TYPES.CHARGEBEE_CARD && <Alert3DS />}
                        {savedMethodRequires3DS(savedMethod.Type) && <ChargebeeSavedCardWrapper {...sharedCbProps} />}
                    </>
                )}
                <>
                    {flow === 'subscription' && methods.savedMethods && (
                        <DefaultPaymentMethodMessage
                            className="my-4"
                            savedPaymentMethods={methods.savedMethods}
                            selectedPaymentMethod={selectedMethodValue}
                        />
                    )}
                    {currencyOverride.isCurrencyOverriden && (
                        <Banner className="mt-2 mb-4" variant={BannerVariants.INFO}>{c('Payments')
                            .t`Your currency has been changed to euros (€) because SEPA bank transfers only support payments in euros.`}</Banner>
                    )}
                </>
            </div>
        );
    } else {
        return (
            <div className="mt-4">
                <NoPaymentRequiredNote
                    hasPaymentMethod={!!methods.savedMethods?.length}
                    subscription={subscription}
                    taxFields={taxFields}
                />
                {children}
            </div>
        );
    }
};

export default PaymentMethodForm;
