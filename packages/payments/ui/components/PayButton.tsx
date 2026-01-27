import { type ElementType, type ReactNode, useMemo } from 'react';

import { c } from 'ttag';

import { Button, type ButtonProps } from '@proton/atoms/Button/Button';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import { greenlandOfferCountryCodes } from '@proton/components/containers/payments/subscription/coupon-config/greenlandIceland';
import useConfig from '@proton/components/hooks/useConfig';
import type { PaymentFacade } from '@proton/components/payments/client-extensions';
import type { ProductParam } from '@proton/shared/lib/apps/product';
import useFlag from '@proton/unleash/useFlag';
import clsx from '@proton/utils/clsx';
import isFunction from '@proton/utils/isFunction';

import { COUPON_CODES, PAYMENT_METHOD_TYPES } from '../../core/constants';
import type { PlainPaymentMethodType } from '../../core/interface';
import type { PaymentTelemetryContext } from '../../telemetry/helpers';
import { checkoutTelemetry } from '../../telemetry/telemetry';
import type { TaxCountryHook } from '../hooks/useTaxCountry';
import { ApplePayButton } from './ApplePayButton';
import { ChargebeePaypalButton } from './ChargebeePaypalButton';
import { GooglePayButton } from './GooglePayButton';

export type PayButtonOnClickPayload = {
    type: 'paypal' | 'apple-pay' | 'google-pay' | 'card';
    source: 'fake-button' | 'real-button';
};

type Props = {
    taxCountry: TaxCountryHook;
    disabled?: boolean;
    children: ReactNode;
    paymentFacade: PaymentFacade;
    suffix?: ReactNode | ((type: PlainPaymentMethodType | undefined) => ReactNode);
    as?: ElementType;
    paypalClassName?: string;
    formInvalid?: boolean;
    onClick?: (payload: PayButtonOnClickPayload) => void;
    product: ProductParam;
    telemetryContext: PaymentTelemetryContext;
} & ButtonProps;

export type OfferUnavailableErrorMessage =
    | {
          paymentDisabled: true;
          message: string;
          hideBillingCountry: boolean;
      }
    | {
          paymentDisabled: false;
          message: never;
          hideBillingCountry: never;
      }
    | undefined;

export function useOfferUnavailableErrorMessage(
    paymentFacade: Pick<PaymentFacade, 'checkResult' | 'paymentStatus'> | undefined
): OfferUnavailableErrorMessage {
    const regionalPaymentBlock = useFlag('GreenlandOfferRegionalPaymentBlock');
    if (!regionalPaymentBlock) {
        return;
    }

    const couponCode = paymentFacade?.checkResult?.Coupon?.Code;
    const paymentStatus = paymentFacade?.paymentStatus;
    if (
        couponCode === COUPON_CODES.PLUS12FOR1 &&
        paymentStatus &&
        !greenlandOfferCountryCodes.includes(paymentStatus.CountryCode)
    ) {
        return {
            message: c('Error').t`This offer is not available in your country`,
            paymentDisabled: true,
            hideBillingCountry: true,
        };
    }

    return undefined;
}

export const PayButton = ({
    taxCountry,
    disabled,
    children,
    paymentFacade,
    suffix,
    as: Component = Button,
    className: classNameProp,
    paypalClassName,
    formInvalid,
    onClick,
    product,
    telemetryContext,
    ...rest
}: Props) => {
    const { APP_NAME } = useConfig();

    const offerUnavailableErrorMessage = useOfferUnavailableErrorMessage(paymentFacade);

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
            });
        }

        onClick?.(payload);
    };

    const submitButton = (() => {
        const isChargebeePaypal = paymentFacade.selectedMethodValue === PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL;
        const isApplePay = paymentFacade.selectedMethodValue === PAYMENT_METHOD_TYPES.APPLE_PAY;
        const isGooglePay = paymentFacade.selectedMethodValue === PAYMENT_METHOD_TYPES.GOOGLE_PAY;
        const submitButtonDisabled =
            !taxCountry.billingAddressValid || disabled || offerUnavailableErrorMessage?.paymentDisabled;

        const className = clsx(submitButtonDisabled && 'cursor-not-allowed', classNameProp);

        if (isChargebeePaypal) {
            const chargebeeWrapperClassName = paypalClassName === undefined ? className : paypalClassName;

            return (
                <ChargebeePaypalButton
                    chargebeePaypal={paymentFacade.chargebeePaypal}
                    iframeHandles={paymentFacade.iframeHandles}
                    disabled={submitButtonDisabled}
                    className={chargebeeWrapperClassName}
                    formInvalid={formInvalid}
                    loading={rest.loading}
                    width="100%"
                    onClick={handleOnClick}
                />
            );
        } else if (isApplePay) {
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
        } else if (isGooglePay) {
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
        } else {
            return (
                <Component
                    type="submit"
                    disabled={submitButtonDisabled}
                    className={className}
                    onClick={() => {
                        handleOnClick({ type: 'card', source: 'real-button' });
                    }}
                    {...rest}
                >
                    {children}
                </Component>
            );
        }
    })();

    const errorMessage = taxCountry?.billingAddressErrorMessage || offerUnavailableErrorMessage?.message;
    if (!errorMessage) {
        return (
            <>
                {submitButton}
                {suffixElement}
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
        </>
    );
};
