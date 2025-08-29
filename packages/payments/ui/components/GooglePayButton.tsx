import { type ReactNode, useMemo } from 'react';

import { ButtonLike } from '@proton/atoms';
import googlePayGreySvg from '@proton/styles/assets/img/bank-icons/dark-gpay.svg';
import clsx from '@proton/utils/clsx';

import type { GooglePayProcessorHook } from '../../core/payment-processors/useGooglePay';
import { ChargebeeIframe } from './ChargebeeIframe';
import type { ChargebeeWrapperProps } from './ChargebeeWrapper';

import './GooglePayButton.scss';

const FakeGooglePayButton = ({
    className,
    loading,
    disabled,
}: {
    className?: string;
    loading?: boolean;
    disabled?: boolean;
}) => {
    const googlePayButtonClassName = clsx([
        'google-pay-button google-pay-button-black',
        disabled && 'google-pay-button--disabled',
        className,
    ]);

    return (
        <ButtonLike
            className={googlePayButtonClassName}
            color="norm"
            loading={loading}
            disabled={disabled}
            data-testid="fake-google-pay-button"
        >
            <img src={googlePayGreySvg} alt="Google Pay" style={{ marginTop: '-6px' }} width="43" />
        </ButtonLike>
    );
};

export interface GooglePayButtonProps extends ChargebeeWrapperProps {
    googlePay: GooglePayProcessorHook;
    disabled?: boolean;
    className?: string;
    formInvalid?: boolean;
    loading?: boolean;
}

export const GooglePayButton = ({ formInvalid, loading, ...props }: GooglePayButtonProps) => {
    const initializing = props.googlePay.initializing;
    const disabled = props.disabled;

    const renderFakeButton = initializing || disabled || formInvalid || loading;
    const fakeGooglePayButton = useMemo(() => {
        const sharedProps = {
            className: clsx('w-full', props.className),
        };

        let button: ReactNode;
        if (disabled) {
            button = <FakeGooglePayButton {...sharedProps} disabled={true} />;
        } else if (initializing || loading) {
            button = <FakeGooglePayButton {...sharedProps} loading={true} />;
        } else {
            button = <FakeGooglePayButton {...sharedProps} />;
        }

        if (renderFakeButton) {
            return <div className="w-full">{button}</div>;
        }
    }, [initializing, disabled, renderFakeButton]);

    return (
        <div className="relative">
            {fakeGooglePayButton}
            <div className={clsx('flex flex-column', renderFakeButton && 'visibility-hidden absolute')}>
                <ChargebeeIframe type="google-pay" {...props} />
            </div>
        </div>
    );
};
