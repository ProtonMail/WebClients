import { type ReactNode, useLayoutEffect } from 'react';

import { c } from 'ttag';

import { BannerVariants } from '@proton/atoms/Banner/Banner';
import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import { IDEAL_WERO_BRAND_NAME } from '@proton/chargebee/lib/constants';
import { InfoBanner } from '@proton/components/containers/payments/subscription/confirm-button/InfoBanner';
import { useStableLoading } from '@proton/hooks';
import clsx from '@proton/utils/clsx';

import type { ChargebeeIdealProcessorHook } from '../../react-extensions/useChargebeeIdeal';
import { ChargebeeIframe } from './ChargebeeIframe';
import type { ChargebeeWrapperProps } from './ChargebeeWrapper';
import type { PayButtonOnClickPayload } from './PayButton';

import './ChargebeeIdealButton.scss';

const FakeChargebeeButton = ({
    className,
    loading,
    disabled,
    children,
    onClick,
}: {
    className?: string;
    loading?: boolean;
    disabled?: boolean;
    children?: ReactNode;
    onClick?: () => void;
}) => {
    const idealButtonClassName = clsx(['ideal-button', disabled && 'ideal-button--disabled', className, 'w-full']);

    return (
        <ButtonLike
            type="button"
            className={idealButtonClassName}
            color="norm"
            loading={loading}
            disabled={disabled}
            onClick={onClick}
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

// The iframe can only be handed a string, so anything richer falls back rather than disagreeing with it.
const getButtonLabel = (children: ReactNode) =>
    typeof children === 'string' ? children : c('Payments').t`Pay with ${IDEAL_WERO_BRAND_NAME}`;

export const ChargebeeIdealButton = ({
    formInvalid,
    loading,
    onClick,
    children,
    ...props
}: ChargebeeIdealButtonProps) => {
    const buttonLabel = getButtonLabel(children);
    const { setButtonLabel } = props.chargebeeIdeal;

    useLayoutEffect(() => {
        setButtonLabel(buttonLabel);
    }, [buttonLabel, setButtonLabel]);

    const initializing = props.chargebeeIdeal.initializing;
    const initializationError = props.chargebeeIdeal.initializationError;
    const disabled = props.disabled || props.chargebeeIdeal.accountHolderNameMissing;

    const syncingName = !disabled && !props.chargebeeIdeal.readyToPay;
    const busy = initializing || !!loading;

    const showSpinner = useStableLoading(busy, { initialState: false });
    const renderFakeButton = initializationError || disabled || formInvalid || busy || showSpinner || syncingName;

    const fakeIdealButton = (() => {
        const fakeButtonProps = {
            className: '',
            ...props,
            children: buttonLabel,
            onClick: () => onClick?.({ source: 'fake-button', type: 'ideal' }),
        };

        if (disabled || initializationError) {
            return <FakeChargebeeButton {...fakeButtonProps} disabled={true} />;
        }

        if (showSpinner) {
            return <FakeChargebeeButton {...fakeButtonProps} loading={true} />;
        }

        return <FakeChargebeeButton {...fakeButtonProps} />;
    })();

    return (
        <div className="relative">
            {initializationError && (
                <InfoBanner variant={BannerVariants.DANGER}>
                    {c('Payments.Error').t`Failed to initialize ${IDEAL_WERO_BRAND_NAME}. Please try again later.`}
                </InfoBanner>
            )}
            {renderFakeButton && <div className="flex flex-column w-full">{fakeIdealButton}</div>}
            <div className={clsx('flex flex-column w-full', renderFakeButton && 'visibility-hidden absolute')}>
                <ChargebeeIframe
                    {...props}
                    type="ideal"
                    onClick={() => onClick?.({ source: 'real-button', type: 'ideal' })}
                />
            </div>
        </div>
    );
};
