import { useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import { InlineLinkButton } from '@proton/atoms';
import { Tooltip } from '@proton/atoms';
import clsx from '@proton/utils/clsx';

import { type BillingAddress, DEFAULT_TAX_BILLING_ADDRESS, getBillingAddressStatus } from '../../core/billing-address';
import { countriesWithStates, getStateList } from '../../core/countries';
import { type PaymentMethodStatusExtended } from '../../core/interface';
import { useCountries } from './CountriesDropdown';
import { CountryStateSelector } from './CountryStateSelector';

function getStateName(countryCode: string, stateCode: string) {
    const state = getStateList(countryCode).find(({ stateCode: code }) => code === stateCode);
    return state?.stateName ?? '';
}

export type OnBillingAddressChange = (billingAddress: BillingAddress) => void;

interface HookProps {
    onBillingAddressChange?: OnBillingAddressChange;
    statusExtended?: Pick<PaymentMethodStatusExtended, 'CountryCode' | 'State'>;
}

interface HookResult {
    selectedCountryCode: string;
    setSelectedCountry: (countryCode: string) => void;
    federalStateCode: string | null;
    setFederalStateCode: (federalStateCode: string) => void;
}

export const useTaxCountry = (props: HookProps): HookResult => {
    const billingAddress: BillingAddress = props.statusExtended
        ? ({
              CountryCode: props.statusExtended.CountryCode,
              State: props.statusExtended.State,
          } satisfies BillingAddress)
        : DEFAULT_TAX_BILLING_ADDRESS;

    const [taxBillingAddress, setTaxBillingAddress] = useState<BillingAddress>(billingAddress);
    const previousBillingAddressRef = useRef(billingAddress);

    useEffect(() => {
        const previousValue = previousBillingAddressRef.current;
        const statusChanged =
            previousValue?.CountryCode !== billingAddress.CountryCode || previousValue?.State !== billingAddress.State;

        if (statusChanged) {
            setTaxBillingAddress(billingAddress);
            props.onBillingAddressChange?.(billingAddress);
            previousBillingAddressRef.current = billingAddress;
        }
    }, [billingAddress.CountryCode, billingAddress.State]);

    const selectedCountryCode = taxBillingAddress.CountryCode;
    const federalStateCode = taxBillingAddress.State ?? null;

    const setSelectedCountry = (CountryCode: string) => {
        const State = countriesWithStates.includes(CountryCode) ? getStateList(CountryCode)[0].stateCode : null;
        const newValue = {
            CountryCode,
            State,
        };
        setTaxBillingAddress(newValue);
        props.onBillingAddressChange?.(newValue);
    };

    const setFederalStateCode = (federalStateCode: string) => {
        const newValue = {
            CountryCode: taxBillingAddress.CountryCode,
            State: federalStateCode,
        };
        setTaxBillingAddress(newValue);
        props.onBillingAddressChange?.(newValue);
    };

    return {
        selectedCountryCode,
        setSelectedCountry,
        federalStateCode,
        setFederalStateCode,
    };
};

export type TaxCountrySelectorProps = HookResult & {
    className?: string;
    labelClassName?: string;
    buttonClassName?: string;
    spacingClassName?: string;
    forceExpand?: boolean;
};

export const TaxCountrySelector = ({
    selectedCountryCode,
    setSelectedCountry,
    setFederalStateCode,
    federalStateCode,
    className,
    labelClassName,
    buttonClassName,
    spacingClassName = 'pt-1 mb-1',
}: TaxCountrySelectorProps) => {
    const showStateCode = countriesWithStates.includes(selectedCountryCode);

    // If there is no state selection, then we collapse the component by default
    // if there is state selection and state **is** specified, then we **collapse** the component by default
    // If there is state selection and state **is not** specified, then we **expand** the component by default
    const initialCollapsedState: boolean = !showStateCode || (showStateCode && !!federalStateCode);

    const [collapsed, setCollapsed] = useState(initialCollapsedState);
    const { getCountryByCode } = useCountries();
    const selectedCountry = getCountryByCode(selectedCountryCode);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const { valid: billingAddressValid, reason: billingAddressInvalidReason } = getBillingAddressStatus({
        CountryCode: selectedCountryCode,
        State: federalStateCode,
    });

    const [showTooltip, setShowTooltip] = useState(false);
    useEffect(() => {
        let timeout: any;
        if (!billingAddressValid) {
            timeout = setTimeout(() => {
                setShowTooltip(true);
            }, 2000);
        } else {
            setShowTooltip(false);
        }

        return () => {
            clearTimeout(timeout);
        };
    }, [billingAddressValid]);

    const collapsedText = (() => {
        if (selectedCountry?.label) {
            let text = selectedCountry.label;
            if (federalStateCode && showStateCode) {
                text += `, ${getStateName(selectedCountryCode, federalStateCode)}`;
            }

            return text;
        }

        return c('Action').t`Select country`;
    })();

    const tooltipText = (() => {
        if (billingAddressInvalidReason === 'missingCountry') {
            return c('Payments').t`Please select billing country`;
        }

        if (billingAddressInvalidReason === 'missingState') {
            // translator: "state" as in "United States of America"
            return c('Payments').t`Please select billing state`;
        }

        return null;
    })();

    return (
        <div className={clsx('field-two-container', className)}>
            <div className={spacingClassName} data-testid="billing-country">
                <Tooltip title={tooltipText} isOpen={showTooltip && !!tooltipText}>
                    <span className={clsx('text-bold', labelClassName)}>{c('Payments').t`Billing Country`}</span>
                </Tooltip>
                {collapsed && (
                    <>
                        <span className={clsx('text-bold mr-2', labelClassName)}>:</span>
                        <InlineLinkButton
                            onClick={() => {
                                setCollapsed(false);
                                setIsDropdownOpen(true);
                            }}
                            data-testid="billing-country-collapsed"
                            className={buttonClassName}
                        >
                            {collapsedText}
                        </InlineLinkButton>
                    </>
                )}
            </div>
            {!collapsed && (
                <CountryStateSelector
                    selectedCountryCode={selectedCountryCode}
                    setSelectedCountry={setSelectedCountry}
                    federalStateCode={federalStateCode}
                    setFederalState={setFederalStateCode}
                    isDropdownOpen={isDropdownOpen}
                />
            )}
        </div>
    );
};

export const WrappedTaxCountrySelector = ({
    className,
    labelClassName,
    buttonClassName,
    spacingClassName,
    onBillingAddressChange,
    statusExtended,
}: {
    className?: string;
    labelClassName?: string;
    buttonClassName?: string;
    spacingClassName?: string;
    onBillingAddressChange?: OnBillingAddressChange;
    statusExtended?: Pick<PaymentMethodStatusExtended, 'CountryCode' | 'State'>;
}) => {
    const taxCountryHook = useTaxCountry({
        onBillingAddressChange,
        statusExtended,
    });

    return (
        <TaxCountrySelector
            {...taxCountryHook}
            className={className}
            labelClassName={labelClassName}
            buttonClassName={buttonClassName}
            spacingClassName={spacingClassName}
        />
    );
};
