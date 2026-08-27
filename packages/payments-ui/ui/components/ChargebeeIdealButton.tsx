import { type ReactNode, useMemo } from 'react';

import { c } from 'ttag';

import { BannerVariants } from '@proton/atoms/Banner/Banner';
import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import { InfoBanner } from '@proton/components/containers/payments/subscription/confirm-button/InfoBanner';
import type { ChargebeeIdealProcessorHook } from '@proton/components/payments/react-extensions/useChargebeeIdeal';
import { useStableLoading } from '@proton/hooks';
import { IDEAL_WERO_BRAND_NAME } from '@proton/shared/lib/constants';
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
            type="button"
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
    children,
    ...props
}: ChargebeeIdealButtonProps) => {
    const initializing = props.chargebeeIdeal.initializing;
    const initializationError = props.chargebeeIdeal.initializationError;
    const disabled = props.disabled || props.chargebeeIdeal.accountHolderNameMissing;

    const syncingName = !disabled && !props.chargebeeIdeal.readyToPay;

    const showLoading = useStableLoading(initializing || !!loading || syncingName, { initialState: false });
    const renderFakeButton =
        initializationError || disabled || formInvalid || initializing || !!loading || showLoading || syncingName;

    const fakeIdealButton = useMemo(() => {
        const fakeButtonProps = {
            className: '',
            ...props,
            children: children ?? c('Payments').t`Pay with ${IDEAL_WERO_BRAND_NAME}`,
        };

        let button: ReactNode;
        if (disabled || initializationError) {
            button = <FakeChargebeeButton {...fakeButtonProps} disabled={true} />;
        } else if (showLoading) {
            button = <FakeChargebeeButton {...fakeButtonProps} loading={true} />;
        } else {
            button = <FakeChargebeeButton {...fakeButtonProps} />;
        }

        if (renderFakeButton) {
            return <div className="w-full">{button}</div>;
        }
    }, [initializationError, disabled, renderFakeButton, showLoading, children]);

    return (
        <div className="relative">
            {initializationError && (
                <InfoBanner variant={BannerVariants.DANGER}>
                    {c('Payments.Error').t`Failed to initialize ${IDEAL_WERO_BRAND_NAME}. Please try again later.`}
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
