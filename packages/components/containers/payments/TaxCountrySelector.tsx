import { useEffect, useMemo, useState } from 'react';

import { c } from 'ttag';

import { InlineLinkButton } from '@proton/atoms';
import type { SelectChangeEvent } from '@proton/components/components/selectTwo/select';
import {
    type BillingAddress,
    DEFAULT_TAX_BILLING_ADDRESS,
    type PaymentMethodStatusExtended,
} from '@proton/components/payments/core';
import clsx from '@proton/utils/clsx';

import { Option, Tooltip } from '../../components';
import type { Props as SearchableSelectProps } from '../../components/selectTwo/SearchableSelect';
import SearchableSelect from '../../components/selectTwo/SearchableSelect';
import CountriesDropdown, { useCountries } from './CountriesDropdown';
import { countriesWithStates, getBillingAddressStatus } from './subscription/helpers';

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

export type TaxCountrySelectorProps = HookResult & {
    className?: string;
};

type StateSelectorProps = {
    onStateChange: (stateCode: string) => void;
    federalStateCode: string | null;
    selectedCountryCode: string;
};

const StateSelector = ({ onStateChange, federalStateCode, selectedCountryCode }: StateSelectorProps) => {
    const states = useMemo(() => getStateList(selectedCountryCode), [selectedCountryCode]);

    const props: SearchableSelectProps<string> = {
        onChange: ({ value: stateCode }: SelectChangeEvent<string>) => onStateChange?.(stateCode),
        value: federalStateCode ?? '',
        id: 'tax-state',
        className: 'mt-1',
        placeholder: c('Placeholder').t`Select state`,
        children: states.map(({ stateName, stateCode }) => {
            return (
                <Option key={stateCode} value={stateCode} title={stateName} data-testid={`state-${stateCode}`}>
                    {stateName}
                </Option>
            );
        }),
    };

    return <SearchableSelect {...props} data-testid="tax-state-dropdown" />;
};

const TaxCountrySelector = ({
    selectedCountryCode,
    setSelectedCountry,
    setFederalStateCode,
    federalStateCode,
    className,
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
            <div className="pt-1 mb-1" data-testid="billing-country">
                <Tooltip title={tooltipText} isOpen={showTooltip && !!tooltipText}>
                    <span className="text-bold">{c('Payments').t`Billing Country`}</span>
                </Tooltip>
                {collapsed && (
                    <>
                        <span className="text-bold mr-2">:</span>
                        <InlineLinkButton
                            onClick={() => {
                                setCollapsed(false);
                                setIsDropdownOpen(true);
                            }}
                            data-testid="billing-country-collapsed"
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
                        data-testid="tax-country-dropdown"
                    />
                    {showStateCode && (
                        <StateSelector
                            onStateChange={setFederalStateCode}
                            federalStateCode={federalStateCode}
                            selectedCountryCode={selectedCountryCode}
                        />
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
    statusExtended?: Pick<PaymentMethodStatusExtended, 'CountryCode' | 'State'>;
}) => {
    const taxCountryHook = useTaxCountry({
        onBillingAddressChange,
        statusExtended,
    });

    return <TaxCountrySelector {...taxCountryHook} className={className} />;
};

export default TaxCountrySelector;
