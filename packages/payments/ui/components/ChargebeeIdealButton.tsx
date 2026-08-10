import { type ReactNode, useMemo } from 'react';

import { c } from 'ttag';

import { BannerVariants } from '@proton/atoms/Banner/Banner';
import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import { InfoBanner } from '@proton/components/containers/payments/subscription/confirm-button/InfoBanner';
import type { ChargebeeIdealProcessorHook } from '@proton/components/payments/react-extensions/useChargebeeIdeal';
import { IDEAL_BRAND_NAME } from '@proton/shared/lib/constants';
import clsx from '@proton/utils/clsx';

import { ChargebeeIframe } from './ChargebeeIframe';
import type { ChargebeeWrapperProps } from './ChargebeeWrapper';
import type { PayButtonOnClickPayload } from './PayButton';

const FakeChargebeeButton = ({
    className,
    loading,
    disabled,
    children,
}: {
    className?: string;
    loading?: boolean;
    disabled?: boolean;
    children?: ReactNode;
}) => {
    const idealButtonClassName = clsx([
        'ideal-button',
        disabled && 'ideal-button--disabled',
        className,
        'button-large',
        'w-full',
    ]);

    return (
        <ButtonLike
            className={idealButtonClassName}
            color="norm"
            loading={loading}
            disabled={disabled}
            data-testid="fake-ideal-button"
        >
            {children}
        </ButtonLike>
    );
};

export interface ChargebeeIdealButtonProps extends ChargebeeWrapperProps {
    chargebeeIdeal: ChargebeeIdealProcessorHook;
    disabled?: boolean;
    className?: string;
    formInvalid?: boolean;
    loading?: boolean;
    onClick?: (payload: PayButtonOnClickPayload) => void;
    children?: ReactNode;
}

export const ChargebeeIdealButton = ({
    formInvalid,
    width: widthProp,
    loading,
    onClick,
    ...props
}: ChargebeeIdealButtonProps) => {
    const initializing = props.chargebeeIdeal.initializing;
    const initializationError = props.chargebeeIdeal.initializationError;
    const disabled = props.disabled;

    const renderFakeButton = initializing || initializationError || disabled || formInvalid || loading;
    const fakeIdealButton = useMemo(() => {
        const fakeButtonProps = {
            className: '',
            onClick: () => onClick?.({ source: 'fake-button', type: 'ideal' }),
            ...props,
        };

        let button: ReactNode;
        if (disabled || initializationError) {
            button = <FakeChargebeeButton {...fakeButtonProps} disabled={true} />;
        } else if (initializing || loading) {
            button = <FakeChargebeeButton {...fakeButtonProps} loading={true} />;
        } else {
            button = <FakeChargebeeButton {...fakeButtonProps} />;
        }

        if (renderFakeButton) {
            return <div className="w-full">{button}</div>;
        }
    }, [initializing, initializationError, disabled, renderFakeButton, loading, formInvalid, onClick]);

    return (
        <div className="relative">
            {initializationError && (
                <InfoBanner variant={BannerVariants.DANGER}>
                    {c('Payments.Error').t`Failed to initialize ${IDEAL_BRAND_NAME}. Please try again later.`}
                </InfoBanner>
            )}
            {fakeIdealButton}
            <div className={clsx('flex flex-column', renderFakeButton && 'visibility-hidden absolute')}>
                <ChargebeeIframe
                    {...props}
                    type="ideal"
                    onClick={() => onClick?.({ source: 'real-button', type: 'ideal' })}
                />
            </div>
        </div>
    );
};
