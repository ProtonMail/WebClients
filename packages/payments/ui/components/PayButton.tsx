import { type ElementType, type ReactNode, useMemo } from 'react';

import { Button, type ButtonProps, Tooltip } from '@proton/atoms';
import { type PaymentFacade } from '@proton/components/payments/client-extensions';
import clsx from '@proton/utils/clsx';
import isFunction from '@proton/utils/isFunction';

import { PAYMENT_METHOD_TYPES } from '../../core/constants';
import { type PlainPaymentMethodType } from '../../core/interface';
import { type TaxCountryHook } from '../hooks/useTaxCountry';
import { ApplePayButton } from './ApplePayButton';
import { ChargebeePaypalButton } from './ChargebeePaypalButton';

type Props = {
    taxCountry: TaxCountryHook;
    disabled?: boolean;
    children: ReactNode;
    paymentFacade: PaymentFacade;
    suffix?: ReactNode | ((type: PlainPaymentMethodType | undefined) => ReactNode);
    as?: ElementType;
    paypalClassName?: string;
    formInvalid?: boolean;
} & ButtonProps;

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
    ...rest
}: Props) => {
    const suffixElement = useMemo(() => {
        if (isFunction(suffix)) {
            return suffix(paymentFacade.selectedMethodType);
        }

        return suffix;
    }, [paymentFacade.selectedMethodType, suffix]);

    const submitButton = (() => {
        const isChargebeePaypal = paymentFacade.selectedMethodValue === PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL;
        const isApplePay = paymentFacade.selectedMethodValue === PAYMENT_METHOD_TYPES.APPLE_PAY;
        const submitButtonDisabled = !taxCountry.billingAddressValid || disabled;

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
                    width="100%"
                />
            );
        } else if (isApplePay) {
            return (
                <ApplePayButton
                    applePay={paymentFacade.applePay}
                    iframeHandles={paymentFacade.iframeHandles}
                    disabled={submitButtonDisabled}
                    formInvalid={formInvalid}
                />
            );
        } else {
            return (
                <Component type="submit" disabled={submitButtonDisabled} className={className} {...rest}>
                    {children}
                </Component>
            );
        }
    })();

    const errorMessage = taxCountry?.billingAddressErrorMessage;
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
