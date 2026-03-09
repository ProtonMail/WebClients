import { c } from 'ttag';

import { isCountryWithRequiredPostalCode } from '../../../core/countries';

export function zipCodeValidator(countryCode: string, zipCode: string | null | undefined): string {
    if (isCountryWithRequiredPostalCode(countryCode) && !zipCode) {
        if (countryCode === 'US') {
            return c('Error').t`ZIP code is required`;
        }

        return c('Error').t`Postal code is required`;
    }

    return '';
}
