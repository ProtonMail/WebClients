import { type ReactNode, useMemo } from 'react';

import { ButtonLike } from '@proton/atoms';
import { type ChargebeePaypalProcessorHook } from '@proton/components/payments/react-extensions/useChargebeePaypal';
import paypalSvg from '@proton/styles/assets/img/bank-icons/paypal-color.svg';
import clsx from '@proton/utils/clsx';

import { ChargebeeIframe, getPaypalButtonWidth } from './ChargebeeIframe';
import { type ChargebeeWrapperProps } from './ChargebeeWrapper';

import '@proton/components/containers/payments/StyledPayPalButton.scss';

const FakeChargebeeButton = ({
    className,
    loading,
    disabled,
    width,
}: {
    className?: string;
    loading?: boolean;
    disabled?: boolean;
    width?: number | string;
}) => {
    const payPalButtonClassName = clsx(['paypal-button', disabled && 'paypal-button--disabled', className]);

    return (
        <ButtonLike
            className={payPalButtonClassName}
            color="norm"
            // the border radius has nothing to do with our theme (unfortunately). It mimicks the styles and border
            // radius of the Paypal button that comes directly from paypal's servers.
            style={{ borderRadius: '4px', width }}
            loading={loading}
            disabled={disabled}
            data-testid="fake-paypal-button"
        >
            <img src={paypalSvg} alt="PayPal" width="57" style={{ marginTop: '-3px' }} />
        </ButtonLike>
    );
};

export interface ChargebeePaypalButtonProps extends ChargebeeWrapperProps {
    chargebeePaypal: ChargebeePaypalProcessorHook;
    disabled?: boolean;
    className?: string;
    formInvalid?: boolean;
}

export const ChargebeePaypalButton = ({ formInvalid, width: widthProp, ...props }: ChargebeePaypalButtonProps) => {
    const initializing = props.chargebeePaypal.initializing;
    const disabled = props.disabled;

    const width = getPaypalButtonWidth(widthProp);

    const renderFakeButton = initializing || disabled || formInvalid;
    const fakePaypalButton = useMemo(() => {
        const fakeButtonProps = {
            width,
        };

        let button: ReactNode;
        if (disabled) {
            button = <FakeChargebeeButton {...fakeButtonProps} disabled={true} />;
        } else if (initializing) {
            button = <FakeChargebeeButton {...fakeButtonProps} loading={true} />;
        } else {
            button = <FakeChargebeeButton {...fakeButtonProps} />;
        }

        if (renderFakeButton) {
            return button;
        }
    }, [initializing, disabled, renderFakeButton]);

    return (
        <div className="relative" style={renderFakeButton ? { width } : undefined}>
            {fakePaypalButton}
            <div className={clsx(renderFakeButton && 'visibility-hidden absolute')}>
                <ChargebeeIframe type="paypal" width={width} {...props} />
            </div>
        </div>
    );
};
