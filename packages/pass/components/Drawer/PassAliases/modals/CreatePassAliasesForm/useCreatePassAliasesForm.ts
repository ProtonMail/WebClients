import { useEffect, useState } from 'react';

import debounce from 'lodash/debounce';
import { c } from 'ttag';

import { validateEmailAddress } from '@proton/shared/lib/helpers/email';

import type { CreateModalFormState } from '../../interface';

type FormErrors = Partial<Record<keyof CreateModalFormState, string>>;
type FormBlur = Partial<Record<keyof CreateModalFormState, boolean>>;

const MANDATORY_FIELDS: (keyof CreateModalFormState)[] = ['name', 'alias', 'mailbox', 'signedSuffix'];

const validateForm = (
    formValues: CreateModalFormState,
    blurred: FormBlur,
    setErrors: (nextErrors: FormErrors | undefined) => void,
    setHasErrors: (hasErrors: boolean) => void
) => {
    const nextErrors: FormErrors = {};

    // Check if there are any errors in form
    if (MANDATORY_FIELDS.some((key) => !formValues[key as keyof CreateModalFormState])) {
        setHasErrors(true);
    } else {
        setHasErrors(false);
    }

    if (blurred.alias) {
        if (!formValues.alias) {
            nextErrors.alias = c('Error').t`Alias is required`;
        }
        if (!validateEmailAddress(formValues.alias)) {
            nextErrors.alias = c('Error').t`Alias is not valid`;
        }
    }

    if (blurred.name && !formValues.name) {
        nextErrors.name = c('Error').t`Name is required`;
    }

    if (blurred.mailbox && !formValues.mailbox) {
        nextErrors.mailbox = c('Error').t`Forward address is required`;
    }

    setErrors(Object.keys(nextErrors).length ? nextErrors : undefined);
};

const throttleValidateForm = debounce(validateForm, 150);

const useCreateModalForm = () => {
    const [formValues, setFormValues] = useState<CreateModalFormState>({
        name: '',
        alias: '',
        mailbox: { email: '', id: 0 },
        note: '',
        signedSuffix: '',
    });
    /** Tells if form has at least one error */
    const [hasErrors, setHasErrors] = useState<boolean>(false);
    /** Contains the errors messages for each field input */
    const [errors, setErrors] = useState<FormErrors>();
    /** True if field input has triggered a blur event */
    const [blurred, setBlurred] = useState<FormBlur>({
        name: false,
        alias: false,
        mailbox: false,
        note: false,
    });

    const [submitted, setSubmitted] = useState<boolean>(false);

    useEffect(() => {
        throttleValidateForm(formValues, blurred, setErrors, setHasErrors);
    }, [formValues, blurred]);

    return {
        formValues,
        setFormValues,
        hasErrors,
        errors,
        blurred,
        setBlurred,
        submitted,
        setSubmitted,
    };
};

export default useCreateModalForm;
