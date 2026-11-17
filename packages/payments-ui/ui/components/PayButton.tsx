import { type ReactNode, useMemo } from 'react';

import { c } from 'ttag';

import { selectUser } from '@proton/account/user';
import { useConfig } from '@proton/app-context/useConfig';
import { BannerVariants } from '@proton/atoms/Banner/Banner';
import { Button, type ButtonProps } from '@proton/atoms/Button/Button';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import { InfoBanner } from '@proton/components/containers/payments/subscription/confirm-button/InfoBanner';
import { PAYMENT_METHOD_TYPES } from '@proton/payments/core/constants';
import type { PlainPaymentMethodType } from '@proton/payments/core/interface';
import { methodMatches } from '@proton/payments/core/type-guards';
import type { PaymentTelemetryContext } from '@proton/payments/telemetry/helpers';
import { checkoutTelemetry } from '@proton/payments/telemetry/telemetry';
import { useStore } from '@proton/redux-shared-store/sharedProvider';
import type { ProductParam } from '@proton/shared/lib/apps/product';
import clsx from '@proton/utils/clsx';
import isFunction from '@proton/utils/isFunction';
import noop from '@proton/utils/noop';

import type { PaymentFacade } from '../../client-extensions/usePaymentFacade';
import {
    IdealAuthorizationText,
    isIdealAuthorizationNoteShown,
} from '../../payment-methods/ideal/IdealAuthorizationText';
import { useEditBillingAddressModal } from '../billing-address/containers/useEditBillingAddressModal';
import type { TaxCountryHook } from '../billing-address/hooks/useTaxCountry';
import type { VatNumberHook } from '../billing-address/hooks/useVatNumber';
import { ApplePayButton } from './ApplePayButton';
import { ChargebeeIdealButton } from './ChargebeeIdealButton';
import { ChargebeePaypalButton } from './ChargebeePaypalButton';
import { GooglePayButton } from './GooglePayButton';

export type PayButtonOnClickPayload = {
    type: 'paypal' | 'apple-pay' | 'google-pay' | 'card' | 'ideal';
    source: 'fake-button' | 'real-button';
};

type Props = {
    taxCountry: TaxCountryHook;
    vatNumber?: VatNumberHook;
    disabled?: boolean;
    children: ReactNode;
    paymentFacade: PaymentFacade;
    suffix?: ReactNode | ((type: PlainPaymentMethodType | undefined) => ReactNode);
    paypalClassName?: string;
    formInvalid?: boolean;
    onClick?: (payload: PayButtonOnClickPayload) => void;
    product: ProductParam;
    telemetryContext: PaymentTelemetryContext;
    isAuthenticated?: boolean;
    showIdealAuthorizationNote?: boolean;
} & ButtonProps;

export const PayButton = ({
    taxCountry,
    vatNumber,
    disabled,
    children,
    paymentFacade,
    suffix,
    className: classNameProp,
    paypalClassName,
    formInvalid,
    onClick,
    product,
    telemetryContext,
    isAuthenticated: isAuthenticatedProp,
    showIdealAuthorizationNote = true,
    ...rest
}: Props) => {
    const { APP_NAME } = useConfig();
    const { editBillingAddressModal, openBillingAddressModal } = useEditBillingAddressModal();

    const store = useStore();
    const isAuthenticated = isAuthenticatedProp ?? !!selectUser(store.getState())?.value;

    const suffixElement = useMemo(() => {
        if (isFunction(suffix)) {
            return suffix(paymentFacade.selectedMethodType);
        }

        return suffix;
    }, [paymentFacade.selectedMethodType, suffix]);

    const handleOnClick = (payload: PayButtonOnClickPayload) => {
        if (paymentFacade.checkResult) {
            checkoutTelemetry.reportPayment({
                stage: 'attempt',
                userCurrency: paymentFacade.user?.Currency,
                subscription: paymentFacade.subscription,
                selectedCycle: paymentFacade.checkResult.Cycle,
                selectedPlanIDs: paymentFacade.checkResult.requestData.Plans,
                selectedCurrency: paymentFacade.currency,
                selectedCoupon: paymentFacade.checkResult.Coupon?.Code,
                build: APP_NAME,
                product,
                context: telemetryContext,
                amount: paymentFacade.checkResult.AmountDue,
                paymentMethodType: paymentFacade.selectedMethodType,
                paymentMethodValue: paymentFacade.selectedMethodValue,
                isTrial: paymentFacade.isTrialIntended,
            });
        }

        onClick?.(payload);
    };

    /**
     * If we can't edit VAT number inline (shouldEditInModal is true) then it means that error states if
     * {@link useVatNumber} are not applicable, and we need to skip them
     */
    const mustCheckVatNumberErrors = vatNumber && !vatNumber?.shouldEditInModal;

    if (isAuthenticated && (!taxCountry.billingAddressStatus.valid || !vatNumber?.vatFormValid)) {
        const errorMessage = taxCountry.billingAddressErrorMessage || vatNumber?.vatFormErrorMessage;
        return (
            <>
                {errorMessage ? <InfoBanner variant={BannerVariants.DANGER}>{errorMessage}</InfoBanner> : null}
                <Button
                    type="button"
                    className={classNameProp}
                    onClick={async (event) => {
                        event.preventDefault();
                        event.stopPropagation();

                        openBillingAddressModal({
                            source: 'pay-button',
                            subscription: paymentFacade.subscription,
                            paymentsApi: taxCountry.paymentsApi,
                            loadingKey: 'editBillingAddress',
                            taxCountry,
                            vatNumber,
                        }).catch(noop);
                    }}
                    {...rest}
                >
                    {c('Payments').t`Edit billing address`}
                </Button>
                {suffixElement}
                {editBillingAddressModal}
            </>
        );
    }

    const submitButton = (() => {
        const selectedMethodValue = paymentFacade.selectedMethodValue;
        const submitButtonDisabled =
            !taxCountry.billingAddressValid || (mustCheckVatNumberErrors && !vatNumber?.vatFormValid) || disabled;

        const className = clsx(submitButtonDisabled && 'cursor-not-allowed', classNameProp);

        const defaultButton = (
            <Button
                type="submit"
                disabled={submitButtonDisabled}
                className={className}
                onClick={() => {
                    handleOnClick({ type: 'card', source: 'real-button' });
                }}
                {...rest}
            >
                {children}
            </Button>
        );

        if (!methodMatches(selectedMethodValue, Object.values(PAYMENT_METHOD_TYPES))) {
            return defaultButton;
        }

        switch (selectedMethodValue) {
            case PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL:
                return (
                    <ChargebeePaypalButton
                        chargebeePaypal={paymentFacade.chargebeePaypal}
                        iframeHandles={paymentFacade.iframeHandles}
                        disabled={submitButtonDisabled}
                        className={paypalClassName === undefined ? className : paypalClassName}
                        formInvalid={formInvalid}
                        loading={rest.loading}
                        width="100%"
                        onClick={handleOnClick}
                    />
                );
            case PAYMENT_METHOD_TYPES.CHARGEBEE_IDEAL:
                return (
                    <ChargebeeIdealButton
                        chargebeeIdeal={paymentFacade.chargebeeIdeal}
                        iframeHandles={paymentFacade.iframeHandles}
                        disabled={submitButtonDisabled}
                        formInvalid={formInvalid}
                        loading={rest.loading}
                        width="100%"
                        onClick={handleOnClick}
                        {...rest}
                    >
                        {children}
                    </ChargebeeIdealButton>
                );
            case PAYMENT_METHOD_TYPES.APPLE_PAY:
                return (
                    <ApplePayButton
                        applePay={paymentFacade.applePay}
                        iframeHandles={paymentFacade.iframeHandles}
                        disabled={submitButtonDisabled}
                        formInvalid={formInvalid}
                        loading={rest.loading}
                        onClick={handleOnClick}
                    />
                );
            case PAYMENT_METHOD_TYPES.GOOGLE_PAY:
                return (
                    <GooglePayButton
                        googlePay={paymentFacade.googlePay}
                        iframeHandles={paymentFacade.iframeHandles}
                        disabled={submitButtonDisabled}
                        formInvalid={formInvalid}
                        loading={rest.loading}
                        onClick={handleOnClick}
                    />
                );
            case PAYMENT_METHOD_TYPES.CHARGEBEE_CARD:
            case PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT:
            case PAYMENT_METHOD_TYPES.CHARGEBEE_BITCOIN:
            case PAYMENT_METHOD_TYPES.CASH:
            case PAYMENT_METHOD_TYPES.TOKEN:
                return defaultButton;
            default:
                selectedMethodValue satisfies never;
                return defaultButton;
        }
    })();

    const idealAccountHolderNameMissing =
        paymentFacade.selectedMethodValue === PAYMENT_METHOD_TYPES.CHARGEBEE_IDEAL &&
        paymentFacade.chargebeeIdeal.accountHolderNameMissing;

    const errorMessage =
        taxCountry?.billingAddressErrorMessage ||
        (mustCheckVatNumberErrors && vatNumber?.vatFormErrorMessage) ||
        (idealAccountHolderNameMissing && c('Payments.Error').t`Please enter the account holder name`);

    const idealAuthorizationNote = showIdealAuthorizationNote && isIdealAuthorizationNoteShown(paymentFacade) && (
        <div className="mt-4 text-center">
            <IdealAuthorizationText />
        </div>
    );

    if (!errorMessage) {
        return (
            <>
                {submitButton}
                {suffixElement}
                {idealAuthorizationNote}
            </>
        );
    }

    return (
        <>
            <Tooltip title={errorMessage} openDelay={0} closeDelay={0}>
                {/* div is needed to enable the tooltip even if the button element is disabled */}
                <div>{submitButton}</div>
            </Tooltip>
            {suffixElement}
            {idealAuthorizationNote}
        </>
    );
};
