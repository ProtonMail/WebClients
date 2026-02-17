import { c } from 'ttag';

import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import { InlineLinkButton } from '@proton/atoms/InlineLinkButton/InlineLinkButton';
import Label from '@proton/components/components/label/Label';

import { getStateName, isCountryWithRequiredPostalCode, isCountryWithStates } from '../../../core/countries';
import type { TaxCountryHook } from '../../hooks/useTaxCountry';
import { useCountries } from '../CountriesDropdown';

type Props = {
    onClick?: () => void;
    loading?: boolean;
} & Pick<TaxCountryHook, 'federalStateCode' | 'zipCode' | 'selectedCountryCode'>;

export const CollapsedTaxCountrySelector = ({
    onClick,
    federalStateCode,
    zipCode,
    selectedCountryCode,
    loading,
}: Props) => {
    const { getCountryByCode } = useCountries();
    const selectedCountry = getCountryByCode(selectedCountryCode);
    const showStateCode = isCountryWithStates(selectedCountryCode);
    const showZipCode = isCountryWithRequiredPostalCode(selectedCountryCode);

    const collapsedText = (() => {
        if (selectedCountry?.label) {
            let text = selectedCountry.label;
            if (federalStateCode && showStateCode) {
                text += `, ${getStateName(selectedCountryCode, federalStateCode)}`;
            }

            if (zipCode && showZipCode) {
                text += `, ${zipCode}`;
            }

            return text;
        }

        return c('Action').t`Select country`;
    })();

    const Element = onClick ? InlineLinkButton : 'span';

    return (
        <Label className="inline-block w-full mb-2" data-testid="billing-country">
            <span className="text-bold">{c('Payments').t`Billing Country`}</span>
            <span className="text-bold mr-2">:</span>
            <Element onClick={onClick} data-testid="billing-country-collapsed">
                {collapsedText}
            </Element>
            {loading && <CircleLoader size="small" className="ml-2" />}
        </Label>
    );
};
