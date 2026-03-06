import type { FullBillingAddressFlat } from '../../core/billing-address/billing-address';
import { useTaxCountry } from './useTaxCountry';
import { useVatNumber } from './useVatNumber';

export type BillingAddressProps = Omit<Parameters<typeof useTaxCountry>[0], 'onBillingAddressChange'> &
    Omit<Parameters<typeof useVatNumber>[0], 'taxCountry' | 'onBillingAddressChange'> & {
        onBillingAddressChange?: (billingAddress: FullBillingAddressFlat) => void;
        disableVat?: boolean;
    };

export const useBillingAddress = (props: BillingAddressProps) => {
    const { onBillingAddressChange: onBillingAddressChangeProp, disableVat: disableVatProp, ...rest } = props;

    const taxCountry = useTaxCountry({ ...rest, onBillingAddressChange: onBillingAddressChangeProp });
    const vatNumber = useVatNumber({
        ...rest,
        taxCountry,
        onBillingAddressChange: (billingAddress) => {
            onBillingAddressChangeProp?.({
                CountryCode: taxCountry.selectedCountryCode,
                State: taxCountry.federalStateCode,
                ZipCode: taxCountry.zipCode,
                VatId: billingAddress.VatId,
                ...billingAddress,
            });
        },
    });

    return {
        vatNumber: disableVatProp ? undefined : vatNumber,
        taxCountry,
    };
};
