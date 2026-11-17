import { useEffect, useRef, useState } from 'react';

import type { RefObjectReact18Compat } from '@proton/atoms/helpers/RefObjectReact18Compat';
import type { VatFormErrors, VatFormFields } from '@proton/payments/core/billing-address/vat-helpers';
import { getVatFormErrors } from '@proton/payments/core/billing-address/vat-helpers';

export type { VatFormFields } from '@proton/payments/core/billing-address/vat-helpers';

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

interface VatFormValidationResult {
    errors: VatFormErrors;
    containerRef: RefObjectReact18Compat<HTMLDivElement>;
    handleFormBlur: (e: React.FocusEvent) => void;
    isValid: boolean;
}

export function useVatFormValidation(
    fields: VatFormFields,
    options?: { collapsed?: boolean }
): VatFormValidationResult {
    const containerRef = useRef<HTMLDivElement>(null);
    const [showErrors, setShowErrors] = useState(false);

    useEffect(() => {
        if (!fields.VatId || options?.collapsed) {
            setShowErrors(false);
        }
    }, [fields.VatId, options?.collapsed]);

    useEffect(() => {
        setShowErrors(false);
    }, [fields.CountryCode]);

    const allErrors = getVatFormErrors(fields);

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
