import type { ChangeEvent, ReactNode, Ref } from 'react';
import { useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import Label from '@proton/components/components/label/Label';
import SkeletonPaymentsForm from '@proton/components/containers/payments/SkeletonPaymentsForm';
import useElementBreakpoints from '@proton/components/hooks/useElementBreakpoints';
import type { ThemeCode } from '@proton/components/payments/client-extensions';
import type { ChargebeeCardProcessorHook } from '@proton/components/payments/react-extensions/useChargebeeCard';
import { rootFontSize } from '@proton/shared/lib/helpers/dom';
import clsx from '@proton/utils/clsx';

import type { PAYMENT_METHOD_TYPES } from '../../core/constants';
import type { ChargeableV5PaymentToken, NonChargeableV5PaymentToken } from '../../core/interface';
import type { CbIframeHandles } from './ChargebeeIframe';
import { ChargebeeIframe } from './ChargebeeIframe';
import { CountriesDropdown } from './CountriesDropdown';
import { InputWithSelectorPrefix } from './InputWithSelectorPrefix';

import './ChargebeeWrapper.scss';

export type ChargebeeWrapperProps = {
    onAuthorizedPaypal?: (paymentIntent: any) => void;
    iframeHandles: CbIframeHandles;
    onInitialized?: () => void;
    width?: number | string;
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
    initialCountryCode?: string;
    suffix?: ReactNode;
    showCountry: boolean;
    creditCardDetailsRef?: Ref<HTMLDivElement>;
}

export const ChargebeeCreditCardWrapper = ({
    chargebeeCard,
    onInitialized,
    initialCountryCode,
    suffix,
    showCountry,
    creditCardDetailsRef,
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

    const zipCodeTitle =
        chargebeeCard.countryCode === 'US'
            ? c('Label, credit card').t`ZIP code`
            : c('Label, credit card').t`Postal code`;

    const commonZipProps = {
        title: zipCodeTitle,
        'data-testid': 'postalCode',
        minLength: 3,
        maxLength: 9,
        autoComplete: 'postal-code',
        id: 'postalcode',
        value: zip,
        onChange: (event: ChangeEvent<HTMLInputElement>) => chargebeeCard?.setPostalCode(event.target.value),
        disableChange: loading,
        'data-protonpass-ignore': true,
    };

    const [initialized, setInitialized] = useState(false);

    const postalCodeError = chargebeeCard.errors.postalCode;

    useEffect(() => {
        if (initialCountryCode) {
            chargebeeCard.setCountryCode(initialCountryCode);
        }
    }, [initialCountryCode]);

    return (
        <div className="mb-1" ref={formWrapperRef}>
            {!initialized && (
                <div className="mb-8">
                    <SkeletonPaymentsForm />
                </div>
            )}
            <div
                className={clsx('flex flex-column', !initialized && 'visibility-hidden absolute')}
                ref={creditCardDetailsRef}
            >
                <Label className="field-two-label field-two-label-container flex pt-3">
                    {c('Label').t`Card details`}
                </Label>
                <ChargebeeIframe
                    type="card"
                    onInitialized={() => {
                        setInitialized(true);
                        onInitialized?.();
                    }}
                    isNarrow={isNarrow}
                    {...rest}
                />
                {showCountry ? (
                    <div className="field-two-container">
                        <Label htmlFor="postalcode" className="field-two-label field-two-label-container flex pt-1">{c(
                            'Label'
                        ).t`Country`}</Label>
                        <InputWithSelectorPrefix
                            placeholder={zipCodeTitle}
                            prefix={
                                <CountriesDropdown
                                    onChange={
                                        loading
                                            ? undefined
                                            : (countryCode) => chargebeeCard?.setCountryCode(countryCode)
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
                            errorTestId="error-postalCode"
                            {...commonZipProps}
                        />
                    </div>
                ) : null}
                {suffix}
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
