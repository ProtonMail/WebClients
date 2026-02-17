import { c } from 'ttag';

import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import { InlineLinkButton } from '@proton/atoms/InlineLinkButton/InlineLinkButton';
import SkeletonLoader from '@proton/components/components/skeletonLoader/SkeletonLoader';
import InputFieldTwo from '@proton/components/components/v2/field/InputField';

import type { TaxCountryHook } from '../hooks/useTaxCountry';
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

export function getVatNumberName(countryCode: string): string {
    const names: Record<string, string> = {
        US: c('Payments.VAT number name').t`EIN`,
        CA: c('Payments.VAT number name').t`Business Number`,
        AU: c('Payments.VAT number name').t`ABN`,
    };

    return names[countryCode] ?? c('Payments.VAT number name').t`VAT number`;
}

export function getAddVatNumberText(countryCode: string): string {
    const names: Record<string, string> = {
        US: c('Payments.VAT number name').t`Add EIN`,
        CA: c('Payments.VAT number name').t`Add Business Number`,
        AU: c('Payments.VAT number name').t`Add ABN`,
    };

    return names[countryCode] ?? c('Payments.VAT number name').t`Add VAT number`;
}

type Props = VatNumberHook & {
    taxCountry: TaxCountryHook;
    onInlineClick: () => void | Promise<void>;
    loadingBillingAddressModal?: boolean;
};

export const VatNumberInput = ({
    vatNumber,
    setVatNumber,
    enableVatNumber,
    taxCountry,
    loadingBillingDetails,
    renderVatNumberInput,
    isAuthenticated,
    onInlineClick,
    loadingBillingAddressModal,
}: Props) => {
    if (!renderVatNumberInput || !enableVatNumber) {
        return null;
    }

    if (loadingBillingDetails) {
        return <SkeletonLoader className="w-full" height="5em" />;
    }

    if (isAuthenticated) {
        return (
            <div data-testid="billing-country" className="mb-4">
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

    return (
        <div className="mb-4">
            <InputFieldTwo
                label={getVatNumberName(taxCountry.selectedCountryCode)}
                hint={c('info').t`Optional`}
                assistiveText={
                    // translator: This is a hint for the VAT number field
                    c('Payments').t`This number will be shown on all future invoices`
                }
                onValue={setVatNumber}
                value={vatNumber}
                placeholder={getVatPlaceholder(taxCountry.selectedCountryCode)}
                data-testid="vat-id-input"
            />
        </div>
    );
};
