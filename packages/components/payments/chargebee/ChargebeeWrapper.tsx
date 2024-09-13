import type { ChangeEvent} from 'react';
import { useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import { Input } from '@proton/atoms';
import { CircleLoader } from '@proton/atoms';
import { Icon, Label } from '@proton/components/components';
import { useElementBreakpoints } from '@proton/components/hooks';
import type {
    ChargeableV5PaymentToken,
    NonChargeableV5PaymentToken,
    PAYMENT_METHOD_TYPES,
} from '@proton/components/payments/core';
import type { ChargebeeCardProcessorHook } from '@proton/components/payments/react-extensions/useChargebeeCard';
import type { ChargebeePaypalProcessorHook } from '@proton/components/payments/react-extensions/useChargebeePaypal';
import { rootFontSize } from '@proton/shared/lib/helpers/dom';
import clsx from '@proton/utils/clsx';

import CountriesDropdown from '../../containers/payments/CountriesDropdown';
import type { ThemeCode } from '../client-extensions';
import type { CbIframeHandles} from './ChargebeeIframe';
import { ChargebeeIframe } from './ChargebeeIframe';

import './ChargebeeWrapper.scss';

export type ChargebeeWrapperProps = {
    onAuthorizedPaypal?: (paymentIntent: any) => void;
    iframeHandles: CbIframeHandles;
    onInitialized?: () => void;
};

export type PaymentIntentHookProps = {
    PaymentMethodType: PAYMENT_METHOD_TYPES.CHARGEBEE_CARD | PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL;
    loadAutomatically?: boolean;
};

export type PaymentIntentHookResult = (
    | {
          loading: true;
          token: null;
      }
    | {
          loading: false;
          token: ChargeableV5PaymentToken | NonChargeableV5PaymentToken;
      }
) & {
    loadPaymentIntent: () => Promise<ChargeableV5PaymentToken | NonChargeableV5PaymentToken>;
};

export interface ChargebeeCardWrapperProps extends ChargebeeWrapperProps {
    chargebeeCard: ChargebeeCardProcessorHook;
    themeCode: ThemeCode;
    initialCountryCode: string | undefined;
}

const WarningIcon = ({ className }: { className?: string }) => {
    return <Icon name="exclamation-circle-filled" className={clsx('shrink-0 color-danger', className)} size={4.5} />;
};

export const ChargebeeCreditCardWrapper = ({
    chargebeeCard,
    onInitialized,
    initialCountryCode,
    ...rest
}: ChargebeeCardWrapperProps) => {
    const formWrapperRef = useRef<HTMLDivElement>(null);
    const narrow = 'narrow';
    const wide = 'wide';

    const breakpoint = useElementBreakpoints(formWrapperRef, {
        [narrow]: 0,
        [wide]: rootFontSize() * 25,
    });
    const isNarrow = breakpoint === narrow;

    const loading = chargebeeCard.processingToken;

    const zip = chargebeeCard?.postalCode;

    const title = c('Label, credit card').t`ZIP code`;

    const commonZipProps = {
        'data-testid': 'postalCode',
        minLength: 3,
        maxLength: 9,
        autoComplete: 'postal-code',
        id: 'postalcode',
        value: zip,
        onChange: (event: ChangeEvent<HTMLInputElement>) => chargebeeCard?.setPostalCode(event.target.value),
        disableChange: loading,
        title: title,
    };

    const [initialized, setInitialized] = useState(false);

    const postalCodeError = chargebeeCard.errors.postalCode;

    useEffect(() => {
        if (initialCountryCode) {
            chargebeeCard.setCountryCode(initialCountryCode);
        }
    }, []);

    return (
        <div ref={formWrapperRef}>
            {!initialized && (
                <div className="flex justify-center">
                    <CircleLoader size="medium" />
                </div>
            )}
            <div className={clsx('flex flex-column', !initialized && 'visibility-hidden')}>
                <Label className="field-two-label field-two-label-container flex pt-3">{c('Label')
                    .t`Card details`}</Label>
                <ChargebeeIframe
                    type="card"
                    onInitialized={() => {
                        setInitialized(true);
                        onInitialized?.();
                    }}
                    isNarrow={isNarrow}
                    {...rest}
                />
                <div className="field-two-container">
                    <Label htmlFor="postalcode" className="field-two-label field-two-label-container flex pt-1">{c(
                        'Label'
                    ).t`Country`}</Label>
                    <Input
                        placeholder={title}
                        className="country-select justify-space-between divide-x"
                        inputClassName="ml-1"
                        prefixClassName="flex-1"
                        prefix={
                            <CountriesDropdown
                                onChange={
                                    loading ? undefined : (countryCode) => chargebeeCard?.setCountryCode(countryCode)
                                }
                                autoComplete="country"
                                selectedCountryCode={chargebeeCard.countryCode}
                                data-testid="country"
                                id="country"
                                unstyled
                                className="mx-3"
                            />
                        }
                        aria-describedby="id_desc_postal"
                        error={postalCodeError}
                        suffix={postalCodeError ? <WarningIcon className="mr-2" /> : null}
                        {...commonZipProps}
                    />
                    <span className="sr-only" id="id_desc_postal">
                        {title}
                    </span>
                    <div className="error-container mt-1 mb-3 text-semibold text-sm flex">
                        {postalCodeError && (
                            <>
                                <WarningIcon className="mr-1" />
                                <span data-testid="error-postalCode">{postalCodeError}</span>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export interface ChargebeePaypalWrapperProps extends ChargebeeWrapperProps {
    chargebeePaypal: ChargebeePaypalProcessorHook;
}

export const ChargebeePaypalWrapper = (props: ChargebeePaypalWrapperProps) => {
    const initializing = props.chargebeePaypal.initializing;

    return (
        <div className="relative">
            {initializing && (
                <div className="absolute centered-loader">
                    <CircleLoader size="small" />
                </div>
            )}

            <div className={clsx('flex flex-column', initializing && 'visibility-hidden')}>
                <ChargebeeIframe type="paypal" {...props} />
            </div>
        </div>
    );
};

export const ChargebeeSavedCardWrapper = (props: ChargebeeWrapperProps) => {
    return (
        <div>
            <ChargebeeIframe type="saved-card" {...props} />
        </div>
    );
};
