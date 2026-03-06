import { c } from 'ttag';

import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import { InlineLinkButton } from '@proton/atoms/InlineLinkButton/InlineLinkButton';
import Checkbox from '@proton/components/components/input/Checkbox';
import SkeletonLoader from '@proton/components/components/skeletonLoader/SkeletonLoader';
import InputFieldTwo from '@proton/components/components/v2/field/InputField';
import { backendBillingAddressFieldError } from '@proton/components/payments/react-extensions/errors';
import useFlag from '@proton/unleash/useFlag';
import clsx from '@proton/utils/clsx';

import type { TaxCountryHook } from '../hooks/useTaxCountry';
import { useVatFormValidation } from '../hooks/useVatFormValidation';
import type { VatNumberHook } from '../hooks/useVatNumber';

export function getVatPlaceholder(countryCode: string) {
    const placeholders: Record<string, string> = {
        AT: 'ATU12345678',
        AU: '12345678912',
        BE: 'BE0123456789',
        BG: 'BG0123456789',
        CA: '123456789RT0001',
        CH: 'CHE-123.456.789 MWST',
        CY: 'CY12345678Z',
        CZ: 'CZ12345678',
        DE: 'DE123456789',
        DK: 'DK12345678',
        EE: 'EE123456789',
        ES: 'ESA1234567Z',
        FI: 'FI12345678',
        FR: 'FRAB123456789',
        GB: 'GB123456789',
        GR: 'EL123456789',
        HR: 'HR12345678912',
        HU: 'HU12345678',
        IE: 'IE1234567T',
        IS: 'IS123456',
        IT: 'IT12345678912',
        LT: 'LT123456789123',
        LU: 'LU12345678',
        LV: 'LV12345678912',
        ME: 'ME12345678',
        MT: 'MT12345678',
        NL: 'NL123456789B12',
        NO: 'NO123456789MVA',
        PL: 'PL1234567890',
        PT: 'PT123456789',
        RO: 'RO1234567891',
        SE: 'SE123456789701',
        SI: 'SI12345678',
        SK: 'SK1234567891',
        US: '12-3456789',
    };

    return placeholders[countryCode] ?? `${countryCode}123456789`;
}

export type CountriesWithCustomVatName = 'US' | 'CA' | 'AU';

export function getVatNumberName(countryCode: string): string {
    const names: Record<CountriesWithCustomVatName, string> = {
        US: c('Payments.VAT number name').t`EIN`,
        CA: c('Payments.VAT number name').t`Business Number`,
        AU: c('Payments.VAT number name').t`ABN`,
    };

    const stringNames = names as Record<string, string>;

    return stringNames[countryCode] ?? c('Payments.VAT number name').t`VAT number`;
}

export function getAddVatNumberText(countryCode: string): string {
    const names: Record<CountriesWithCustomVatName, string> = {
        US: c('Payments.VAT number name').t`Add EIN`,
        CA: c('Payments.VAT number name').t`Add Business Number`,
        AU: c('Payments.VAT number name').t`Add ABN`,
    };

    const stringNames = names as Record<string, string>;

    return stringNames[countryCode] ?? c('Payments.VAT number name').t`Add VAT number`;
}

type Props = VatNumberHook & {
    className?: string;
    taxCountry: TaxCountryHook;
    onInlineClick: () => void | Promise<void>;
    loadingBillingAddressModal?: boolean;
};

export const VatNumberInput = ({
    vatNumber,
    setVatNumber,
    Company,
    setCompany,
    FirstName,
    setFirstName,
    LastName,
    setLastName,
    Address,
    setAddress,
    City,
    setCity,
    enableVatNumber,
    taxCountry,
    loadingBillingDetails,
    renderVatNumberInput,
    shouldEditInModal,
    onInlineClick,
    loadingBillingAddressModal,
    className,
    unauthenticatedCollapsed,
    setUnauthenticatedCollapsed,
}: Props) => {
    const showExtendedBillingAddressForm = useFlag('PaymentsValidateBillingAddress');
    const {
        errors: { errorMessages },
        containerRef,
        handleFormBlur,
    } = useVatFormValidation(
        {
            CountryCode: taxCountry.selectedCountryCode,
            State: taxCountry.federalStateCode,
            ZipCode: taxCountry.zipCode,
            VatId: vatNumber,
            Company,
            FirstName,
            LastName,
            Address,
            City,
        },
        { collapsed: unauthenticatedCollapsed }
    );
    const { billingAddressValidationResult } = taxCountry;

    if (!renderVatNumberInput || !enableVatNumber) {
        return null;
    }

    if (loadingBillingDetails) {
        return <SkeletonLoader className="w-full" height="5em" />;
    }

    if (shouldEditInModal) {
        return (
            <div data-testid="billing-country" className={className}>
                <span className="text-bold">{c('Payments').t`VAT number`}</span>
                <>
                    <span className="text-bold mr-2">:</span>
                    <InlineLinkButton onClick={onInlineClick} data-testid="vat-id-collapsed" className="mt-2">
                        {vatNumber ? vatNumber : getAddVatNumberText(taxCountry.selectedCountryCode)}
                    </InlineLinkButton>
                    {loadingBillingAddressModal && <CircleLoader size="small" className="ml-2" />}
                </>
            </div>
        );
    }

    const optionalHint = c('info').t`Optional`;

    const inputs = (
        <>
            <InputFieldTwo
                label={getVatNumberName(taxCountry.selectedCountryCode)}
                hint={optionalHint}
                onValue={setVatNumber}
                value={vatNumber}
                placeholder={getVatPlaceholder(taxCountry.selectedCountryCode)}
                data-testid="vat-id-input"
                error={errorMessages.VatId || backendBillingAddressFieldError(billingAddressValidationResult?.VatId)}
            />
            {showExtendedBillingAddressForm && (
                <>
                    <InputFieldTwo
                        label={c('Label').t`Company`}
                        hint={vatNumber ? undefined : optionalHint}
                        onValue={setCompany}
                        value={Company ?? ''}
                        placeholder={c('Placeholder').t`Cortex Inc.`}
                        data-testid="company-input"
                        error={
                            errorMessages.Company ||
                            backendBillingAddressFieldError(billingAddressValidationResult?.Company)
                        }
                    />
                    <InputFieldTwo
                        label={c('Label').t`City`}
                        hint={vatNumber ? undefined : optionalHint}
                        onValue={setCity}
                        value={City ?? ''}
                        placeholder={c('Placeholder').t`San Francisco`}
                        data-testid="city-input"
                        error={
                            errorMessages.City || backendBillingAddressFieldError(billingAddressValidationResult?.City)
                        }
                    />
                    <InputFieldTwo
                        label={c('Label').t`Street address`}
                        hint={vatNumber ? undefined : optionalHint}
                        onValue={setAddress}
                        value={Address ?? ''}
                        placeholder={c('Placeholder').t`Main street 12`}
                        data-testid="street-address-input"
                        error={
                            errorMessages.Address ||
                            backendBillingAddressFieldError(billingAddressValidationResult?.Address)
                        }
                    />
                    <div className="flex gap-4">
                        <InputFieldTwo
                            label={c('Label').t`First name`}
                            hint={vatNumber ? undefined : optionalHint}
                            onValue={setFirstName}
                            value={FirstName ?? ''}
                            placeholder={c('Placeholder').t`Thomas`}
                            data-testid="first-name-input"
                            error={
                                errorMessages.FirstName ||
                                backendBillingAddressFieldError(billingAddressValidationResult?.FirstName)
                            }
                            rootClassName="flex-1"
                        />
                        <InputFieldTwo
                            label={c('Label').t`Last name`}
                            hint={vatNumber ? undefined : optionalHint}
                            onValue={setLastName}
                            value={LastName ?? ''}
                            placeholder={c('Placeholder').t`Anderson`}
                            data-testid="last-name-input"
                            error={
                                errorMessages.LastName ||
                                backendBillingAddressFieldError(billingAddressValidationResult?.LastName)
                            }
                            rootClassName="flex-1"
                        />
                    </div>
                </>
            )}
        </>
    );

    return (
        <div className={className} ref={containerRef} onBlur={handleFormBlur}>
            <Checkbox
                checked={!unauthenticatedCollapsed}
                onChange={() => setUnauthenticatedCollapsed(!unauthenticatedCollapsed)}
                data-testid="vat-id-checkbox"
                className={clsx(!unauthenticatedCollapsed && 'mb-4')}
            >
                {c('Payments').t`I'm purchasing as a business`}
            </Checkbox>
            {unauthenticatedCollapsed ? null : inputs}
        </div>
    );
};
