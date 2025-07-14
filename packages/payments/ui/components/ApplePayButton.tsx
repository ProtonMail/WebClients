import { type ReactNode, useMemo } from 'react';

import { ButtonLike } from '@proton/atoms';
import clsx from '@proton/utils/clsx';

import type { ApplePayProcessorHook } from '../../core/payment-processors/useApplePay';
import { ChargebeeIframe } from './ChargebeeIframe';
import type { ChargebeeWrapperProps } from './ChargebeeWrapper';

import './ApplePayButton.scss';

const FakeApplePayButton = ({
    className,
    loading,
    disabled,
}: {
    className?: string;
    loading?: boolean;
    disabled?: boolean;
}) => {
    const applePayButtonClassName = clsx([
        'apple-pay-button apple-pay-button-black',
        disabled && 'apple-pay-button--disabled',
        className,
    ]);

    return (
        <ButtonLike
            className={applePayButtonClassName}
            color="norm"
            // these styles have nothing to do with our theme (unfortunately).
            // It mimicks the styles and border raidus of the Paypal button that comes directly from paypal's servers
            style={{ borderRadius: '4px' }}
            loading={loading}
            disabled={disabled}
        />
    );
};

export interface ApplePayButtonProps extends ChargebeeWrapperProps {
    applePay: ApplePayProcessorHook;
    disabled?: boolean;
    className?: string;
    formInvalid?: boolean;
}

export const ApplePayButton = ({ formInvalid, ...props }: ApplePayButtonProps) => {
    const initializing = props.applePay.initializing;
    const disabled = props.disabled;

    const renderFakeButton = initializing || disabled || formInvalid;
    const fakeApplePayButton = useMemo(() => {
        const sharedProps = {
            className: clsx('w-full', props.className),
        };

        let button: ReactNode;
        if (disabled) {
            button = <FakeApplePayButton {...sharedProps} disabled={true} />;
        } else if (initializing) {
            button = <FakeApplePayButton {...sharedProps} loading={true} />;
        } else {
            button = <FakeApplePayButton {...sharedProps} />;
        }

        if (renderFakeButton) {
            return <div className="w-full">{button}</div>;
        }
    }, [initializing, disabled, renderFakeButton]);

    return (
        <div className="relative">
            {fakeApplePayButton}
            <div className={clsx('flex flex-column', renderFakeButton && 'visibility-hidden absolute')}>
                <ChargebeeIframe type="apple-pay" {...props} />
            </div>
        </div>
    );
};
