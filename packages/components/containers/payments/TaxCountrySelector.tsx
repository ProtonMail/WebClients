import { useEffect, useMemo, useState } from 'react';

import { c } from 'ttag';

import { InlineLinkButton } from '@proton/atoms/InlineLinkButton';
import { SelectChangeEvent } from '@proton/components/components/selectTwo/select';
import {
    BillingAddress,
    PAYMENT_METHOD_TYPES,
    PaymentMethodFlows,
    PaymentMethodStatusExtended,
    SavedPaymentMethodExternal,
    SavedPaymentMethodInternal,
} from '@proton/components/payments/core';
import clsx from '@proton/utils/clsx';

import { Option, SelectTwo } from '../../components';
import CountriesDropdown, { useCountries } from './CountriesDropdown';

function getStateList(countryCode: string) {
    if (countryCode === 'US') {
        return [
            { stateName: 'Alabama', stateCode: 'AL' },
            { stateName: 'Alaska', stateCode: 'AK' },
            { stateName: 'Arizona', stateCode: 'AZ' },
            { stateName: 'Arkansas', stateCode: 'AR' },
            { stateName: 'California', stateCode: 'CA' },
            { stateName: 'Colorado', stateCode: 'CO' },
            { stateName: 'Connecticut', stateCode: 'CT' },
            { stateName: 'Delaware', stateCode: 'DE' },
            { stateName: 'Florida', stateCode: 'FL' },
            { stateName: 'Georgia', stateCode: 'GA' },
            { stateName: 'Hawaii', stateCode: 'HI' },
            { stateName: 'Idaho', stateCode: 'ID' },
            { stateName: 'Illinois', stateCode: 'IL' },
            { stateName: 'Indiana', stateCode: 'IN' },
            { stateName: 'Iowa', stateCode: 'IA' },
            { stateName: 'Kansas', stateCode: 'KS' },
            { stateName: 'Kentucky', stateCode: 'KY' },
            { stateName: 'Louisiana', stateCode: 'LA' },
            { stateName: 'Maine', stateCode: 'ME' },
            { stateName: 'Maryland', stateCode: 'MD' },
            { stateName: 'Massachusetts', stateCode: 'MA' },
            { stateName: 'Michigan', stateCode: 'MI' },
            { stateName: 'Minnesota', stateCode: 'MN' },
            { stateName: 'Mississippi', stateCode: 'MS' },
            { stateName: 'Missouri', stateCode: 'MO' },
            { stateName: 'Montana', stateCode: 'MT' },
            { stateName: 'Nebraska', stateCode: 'NE' },
            { stateName: 'Nevada', stateCode: 'NV' },
            { stateName: 'New Hampshire', stateCode: 'NH' },
            { stateName: 'New Jersey', stateCode: 'NJ' },
            { stateName: 'New Mexico', stateCode: 'NM' },
            { stateName: 'New York', stateCode: 'NY' },
            { stateName: 'North Carolina', stateCode: 'NC' },
            { stateName: 'North Dakota', stateCode: 'ND' },
            { stateName: 'Ohio', stateCode: 'OH' },
            { stateName: 'Oklahoma', stateCode: 'OK' },
            { stateName: 'Oregon', stateCode: 'OR' },
            { stateName: 'Pennsylvania', stateCode: 'PA' },
            { stateName: 'Rhode Island', stateCode: 'RI' },
            { stateName: 'South Carolina', stateCode: 'SC' },
            { stateName: 'South Dakota', stateCode: 'SD' },
            { stateName: 'Tennessee', stateCode: 'TN' },
            { stateName: 'Texas', stateCode: 'TX' },
            { stateName: 'Utah', stateCode: 'UT' },
            { stateName: 'Vermont', stateCode: 'VT' },
            { stateName: 'Virginia', stateCode: 'VA' },
            { stateName: 'Washington', stateCode: 'WA' },
            { stateName: 'West Virginia', stateCode: 'WV' },
            { stateName: 'Wisconsin', stateCode: 'WI' },
            { stateName: 'Wyoming', stateCode: 'WY' },
            { stateName: 'District of Columbia', stateCode: 'DC' },
            { stateName: 'American Samoa', stateCode: 'AS' },
            { stateName: 'Micronesia', stateCode: 'FM' },
            { stateName: 'Guam', stateCode: 'GU' },
            { stateName: 'Puerto Rico', stateCode: 'PR' },
            { stateName: 'Virgin Islands, U.S.', stateCode: 'VI' },
            { stateName: 'Marshall Islands', stateCode: 'MH' },
            { stateName: 'Northern Mariana Islands', stateCode: 'MP' },
            { stateName: 'Palau', stateCode: 'PW' },
        ];
    }

    if (countryCode === 'CA') {
        return [
            { stateName: 'Alberta', stateCode: 'AB' },
            { stateName: 'British Columbia', stateCode: 'BC' },
            { stateName: 'Manitoba', stateCode: 'MB' },
            { stateName: 'New Brunswick', stateCode: 'NB' },
            { stateName: 'Newfoundland and Labrador', stateCode: 'NL' },
            { stateName: 'Northwest Territories', stateCode: 'NT' },
            { stateName: 'Nova Scotia', stateCode: 'NS' },
            { stateName: 'Nunavut', stateCode: 'NU' },
            { stateName: 'Ontario', stateCode: 'ON' },
            { stateName: 'Prince Edward Island', stateCode: 'PE' },
            { stateName: 'Quebec', stateCode: 'QC' },
            { stateName: 'Saskatchewan', stateCode: 'SK' },
            { stateName: 'Yukon', stateCode: 'YT' },
        ];
    }

    return [];
}

function getStateName(countryCode: string, stateCode: string) {
    const state = getStateList(countryCode).find(({ stateCode: code }) => code === stateCode);
    return state?.stateName ?? '';
}

export type OnBillingAddressChange = (billingAddress: BillingAddress) => void;

interface HookProps {
    onBillingAddressChange?: OnBillingAddressChange;
    statusExtended?: PaymentMethodStatusExtended;
}

interface HookResult {
    selectedCountryCode: string;
    setSelectedCountry: (countryCode: string) => void;
    federalStateCode: string | null;
    setFederalStateCode: (federalStateCode: string) => void;
}

const DEFAULT_TAX_COUNTRY_CODE = 'CH';
export const DEFAULT_TAX_BILLING_ADDRESS: BillingAddress = {
    CountryCode: DEFAULT_TAX_COUNTRY_CODE,
    State: null,
};

const countriesWithStates = ['US', 'CA'];

export const useTaxCountry = (props: HookProps): HookResult => {
    const billingAddress: BillingAddress = props.statusExtended
        ? ({
              CountryCode: props.statusExtended.CountryCode,
              State: props.statusExtended.State,
          } as BillingAddress)
        : DEFAULT_TAX_BILLING_ADDRESS;

    const [taxBillingAddress, setTaxBillingAddress] = useState<BillingAddress>(billingAddress);

    useEffect(() => {
        props.onBillingAddressChange?.(taxBillingAddress);
    }, [taxBillingAddress]);

    const selectedCountryCode = taxBillingAddress.CountryCode;
    const federalStateCode = taxBillingAddress.State ?? null;

    const setSelectedCountry = (CountryCode: string) => {
        const State = countriesWithStates.includes(CountryCode) ? getStateList(CountryCode)[0].stateCode : null;

        setTaxBillingAddress({
            CountryCode,
            State,
        });
    };

    const setFederalStateCode = (federalStateCode: string) => {
        setTaxBillingAddress((prev) => ({
            ...prev,
            State: federalStateCode,
        }));
    };

    return {
        selectedCountryCode,
        setSelectedCountry,
        federalStateCode,
        setFederalStateCode,
    };
};

export function showTaxCountry(
    method: string | undefined,
    type: PaymentMethodFlows,
    savedMethod: SavedPaymentMethodInternal | SavedPaymentMethodExternal | undefined
) {
    const methodsWithTaxCountry: (string | undefined)[] = [
        PAYMENT_METHOD_TYPES.CHARGEBEE_CARD,
        PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL,
    ];
    const flowsWithTaxCountry: PaymentMethodFlows[] = ['signup', 'signup-pass', 'signup-vpn', 'subscription'];

    const isNewAllowedMethod = methodsWithTaxCountry.includes(method);
    const isSavedAllowedMethod = savedMethod && methodsWithTaxCountry.includes(savedMethod.Type);

    const showTaxCountry = (isNewAllowedMethod || isSavedAllowedMethod) && flowsWithTaxCountry.includes(type);
    return showTaxCountry;
}

export type TaxCountrySelectorProps = HookResult & {
    className?: string;
};

const useCountriesWhitelist = () => {
    const countries = [
        'AU',
        'AT',
        'BE',
        'BG',
        'HR',
        'CY',
        'CZ',
        'DK',
        'EE',
        'FI',
        'FR',
        'DE',
        'GR',
        'HU',
        'IE',
        'IT',
        'LV',
        'LI',
        'LT',
        'LU',
        'MT',
        'NL',
        'NO',
        'PL',
        'PT',
        'RO',
        'SK',
        'SI',
        'ES',
        'SE',
        'CH',
        'GB',
    ];

    const isCountryAllowed = (countryCode: string) => countries.includes(countryCode);

    return { isCountryAllowed };
};

const TaxCountrySelector = ({
    selectedCountryCode,
    setSelectedCountry,
    setFederalStateCode,
    federalStateCode,
    className,
}: TaxCountrySelectorProps) => {
    const [collapsed, setCollapsed] = useState(true);
    const { getCountryByCode } = useCountries();
    const selectedCountry = getCountryByCode(selectedCountryCode);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const { isCountryAllowed } = useCountriesWhitelist();
    const title = isCountryAllowed(selectedCountryCode)
        ? c('Payments').t`Tax Country`
        : c('Payments').t`Billing Country`;

    const showStateCode = countriesWithStates.includes(selectedCountryCode);
    const states = useMemo(() => getStateList(selectedCountryCode), [selectedCountryCode]);

    const collapsedText = (() => {
        if (selectedCountry?.text) {
            let text = selectedCountry.text;
            if (federalStateCode && showStateCode) {
                text += `, ${getStateName(selectedCountryCode, federalStateCode)}`;
            }

            return text;
        }

        return c('Action').t`Select country`;
    })();

    return (
        <div className={clsx('field-two-container', className)}>
            <div className="pt-1 mb-1">
                <span className="text-bold">{title}</span>
                {collapsed && (
                    <>
                        <span className="text-bold mr-2">:</span>
                        <InlineLinkButton
                            onClick={() => {
                                setCollapsed(false);
                                setIsDropdownOpen(true);
                            }}
                        >
                            {collapsedText}
                        </InlineLinkButton>
                    </>
                )}
            </div>
            {!collapsed && (
                <>
                    <CountriesDropdown
                        selectedCountryCode={selectedCountryCode}
                        onChange={setSelectedCountry}
                        id="tax-country"
                        isOpen={isDropdownOpen}
                        onOpen={() => setIsDropdownOpen(true)}
                        onClose={() => setIsDropdownOpen(false)}
                    />
                    {showStateCode && (
                        <SelectTwo
                            onChange={({ value }: SelectChangeEvent<string>) => {
                                setFederalStateCode?.(value);
                            }}
                            value={federalStateCode ?? ''}
                            id="tax-state"
                            className="mt-1"
                        >
                            {states.map(({ stateName, stateCode }) => {
                                return (
                                    <Option
                                        key={stateCode}
                                        value={stateCode}
                                        title={stateName}
                                        data-testid={`state-${stateCode}`}
                                    >
                                        {stateName}
                                    </Option>
                                );
                            })}
                        </SelectTwo>
                    )}
                </>
            )}
        </div>
    );
};

export const WrappedTaxCountrySelector = ({
    className,
    onBillingAddressChange,
    statusExtended,
}: {
    className?: string;
    onBillingAddressChange?: OnBillingAddressChange;
    statusExtended?: PaymentMethodStatusExtended;
}) => {
    const taxCountryHook = useTaxCountry({
        onBillingAddressChange,
        statusExtended,
    });

    return <TaxCountrySelector {...taxCountryHook} className={className} />;
};

export default TaxCountrySelector;
