import { useEffect, useRef, useState } from 'react';

import { c } from 'ttag';
import { checkVAT, countries as vatValidationCountries } from 'vat-validation';

import { isProduction } from '@proton/shared/lib/helpers/sentry';
import useFlag from '@proton/unleash/useFlag';
import isTruthy from '@proton/utils/isTruthy';

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

function checkVatNumber(vatNumber: string, countryCode: string): boolean {
    // In dev env, we let these VAT numbers to bypass the frontend validation
    if (!isProduction(window.location.host) && (vatNumber === 'IT01231231234' || vatNumber === 'BE0123123123')) {
        return true;
    }

    const countries = vatValidationCountries.filter((country) => country.codes.includes(countryCode)) ?? [];

    return checkVAT(vatNumber, countries).isValid;
}

function validateVatNumber(vatNumber: string, countryCode: string): string {
    return checkVatNumber(vatNumber, countryCode) ? '' : c('Error').t`Invalid VAT number`;
}

function getVatFormErrorMessages(
    fields: VatFormFields,
    showExtendedBillingAddressForm: boolean
): VatFormErrors['errorMessages'] {
    const errors: VatFormErrors['errorMessages'] = emptyErrors().errorMessages;
    if (!fields.VatId) {
        return errors;
    }

    errors.VatId = validateVatNumber(fields.VatId, fields.CountryCode);

    if (!showExtendedBillingAddressForm) {
        return errors;
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
export function getVatFormErrors(fields: VatFormFields, showExtendedBillingAddressForm: boolean): VatFormErrors {
    const errorMessages = getVatFormErrorMessages(fields, showExtendedBillingAddressForm);
    return {
        hasErrors: Object.values(errorMessages).some(isTruthy),
        errorMessages,
    };
}

export interface VatFormValidationResult {
    errors: VatFormErrors;
    containerRef: React.RefObject<HTMLDivElement>;
    handleFormBlur: (e: React.FocusEvent) => void;
    isValid: boolean;
}

export function useVatFormValidation(
    fields: VatFormFields,
    options?: { collapsed?: boolean }
): VatFormValidationResult {
    const containerRef = useRef<HTMLDivElement>(null) as React.RefObject<HTMLDivElement>;
    const [showErrors, setShowErrors] = useState(false);

    useEffect(() => {
        if (!fields.VatId || options?.collapsed) {
            setShowErrors(false);
        }
    }, [fields.VatId, options?.collapsed]);

    const showExtendedBillingAddressForm = useFlag('PaymentsValidateBillingAddress');
    const allErrors = getVatFormErrors(fields, showExtendedBillingAddressForm);

    const handleFormBlur = (e: React.FocusEvent) => {
        if (!fields.VatId) {
            return;
        }
        if (containerRef.current?.contains(e.relatedTarget as Node)) {
            return;
        }
        setShowErrors(true);
    };

    const visibleErrors: VatFormErrors = showErrors ? allErrors : emptyErrors();
    const isValid = !allErrors.hasErrors;

    return {
        errors: visibleErrors,
        containerRef,
        handleFormBlur,
        isValid,
    };
}
