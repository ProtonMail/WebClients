import { c } from 'ttag';
import { checkVAT, countries as vatValidationCountries } from 'vat-validation';

import { isProduction } from '@proton/shared/lib/helpers/sentry';
import isTruthy from '@proton/utils/isTruthy';

import { countriesWithVatNumberOnSignup } from './countries-with-vat-id';
import { getValidVatPrefixes, isBareVatPrefix, vatNumberMissingPrefix } from './vat-prefix-helper';

export interface VatFormFields {
    CountryCode: string;
    State?: string | null;
    ZipCode?: string | null;
    VatId?: string | null;
    Company?: string | null;
    FirstName?: string | null;
    LastName?: string | null;
    Address?: string | null;
    City?: string | null;
}

export interface VatFormErrors {
    hasErrors: boolean;
    errorMessages: {
        VatId: string;
        Company: string;
        FirstName: string;
        LastName: string;
        Address: string;
        City: string;
    };
}

function emptyErrors(): VatFormErrors {
    return {
        hasErrors: false,
        errorMessages: {
            VatId: '',
            Company: '',
            FirstName: '',
            LastName: '',
            Address: '',
            City: '',
        },
    };
}

export function checkVatNumber(vatNumber: string, countryCode: string): boolean {
    if (!countriesWithVatNumberOnSignup.has(countryCode)) {
        return true;
    }

    if (!isProduction(window.location.host) && (vatNumber === 'IT01231231234' || vatNumber === 'BE0123123123')) {
        return true;
    }

    const countries = vatValidationCountries.filter((country) => country.codes.includes(countryCode));

    if (countries.length === 0) {
        return true;
    }

    return checkVAT(vatNumber, countries).isValid;
}

function validateVatNumber(vatNumber: string, countryCode: string): string {
    return checkVatNumber(vatNumber, countryCode) ? '' : c('Error').t`Invalid VAT number`;
}

function getVatFormErrorMessages(fields: VatFormFields): VatFormErrors['errorMessages'] {
    const errors: VatFormErrors['errorMessages'] = emptyErrors().errorMessages;
    if (!fields.VatId || isBareVatPrefix(fields.VatId, fields.CountryCode)) {
        return errors;
    }

    if (vatNumberMissingPrefix(fields.VatId, fields.CountryCode)) {
        const validPrefixes = getValidVatPrefixes(fields.CountryCode);
        if (validPrefixes !== null) {
            const prefixes = validPrefixes.join(', ');
            errors.VatId = c('Error').t`VAT number must start with ${prefixes}`;
        }
    } else {
        errors.VatId = validateVatNumber(fields.VatId, fields.CountryCode);
    }

    if (!fields.Address) {
        errors.Address = c('Error').t`This field is required`;
    }
    if (!fields.City) {
        errors.City = c('Error').t`This field is required`;
    }

    if (fields.FirstName && !fields.LastName) {
        errors.LastName = c('Error').t`This field is required`;
    }
    if (fields.LastName && !fields.FirstName) {
        errors.FirstName = c('Error').t`This field is required`;
    }

    const hasCompany = !!fields.Company;
    const hasFullName = !!fields.FirstName && !!fields.LastName;

    if (!hasCompany && !hasFullName && !errors.FirstName && !errors.LastName) {
        errors.Company = c('Error').t`Company name or personal name is required`;
    }

    return errors;
}

/**
 * Pure validation function. Rules when VAT number is present:
 * 1. Must provide Company OR (First Name AND Last Name)
 * 2. Address and City are always required
 * 3. First Name and Last Name are paired — providing one requires the other
 */
export function getVatFormErrors(fields: VatFormFields): VatFormErrors {
    const errorMessages = getVatFormErrorMessages(fields);
    return {
        hasErrors: Object.values(errorMessages).some(isTruthy),
        errorMessages,
    };
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
