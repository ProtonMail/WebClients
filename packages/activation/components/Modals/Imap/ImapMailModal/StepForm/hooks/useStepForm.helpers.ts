import { c } from 'ttag';

import { IMPORT_ERROR, ImportProvider } from '@proton/activation/interface';

import { StepFormBlur, StepFormErrors, StepFormState } from './useStepForm.interface';

const IMAPS = {
    [ImportProvider.GOOGLE]: 'imap.gmail.com',
    [ImportProvider.YAHOO]: 'export.imap.mail.yahoo.com',
    [ImportProvider.OUTLOOK]: 'outlook.office365.com',
    [ImportProvider.DEFAULT]: '',
};

const PORTS = {
    [ImportProvider.GOOGLE]: '993',
    [ImportProvider.YAHOO]: '993',
    [ImportProvider.OUTLOOK]: '993',
    [ImportProvider.DEFAULT]: '',
};

export const getDefaultImap = (provider?: ImportProvider): string =>
    provider ? IMAPS[provider] : IMAPS[ImportProvider.DEFAULT];

export const getDefaultPort = (provider?: ImportProvider): string =>
    provider ? PORTS[provider] : PORTS[ImportProvider.DEFAULT];

export const validateStepForm = (
    formValues: StepFormState,
    blurred: StepFormBlur,
    setErrors: (nextErrors: StepFormErrors | undefined) => void,
    setHasErrors: (hasErrors: boolean) => void,
    apiErrorCode?: number,
    apiErrorMessage?: string
) => {
    const nextErrors: StepFormErrors = {};

    // Check if there are any errors in form
    if (Object.keys(formValues).some((key) => !formValues[key as keyof StepFormState])) {
        setHasErrors(true);
    } else {
        setHasErrors(false);
    }

    // Check if we set some error messages
    if (blurred.emailAddress && !formValues.emailAddress) {
        nextErrors.emailAddress = c('Error').t`Email address is required`;
    }

    if (blurred.password && !formValues.password) {
        nextErrors.password = c('Error').t`Password is required`;
    }

    if (blurred.imap && !formValues.imap) {
        nextErrors.imap = c('Error').t`IMAP server is required`;
    }

    if (blurred.port && !formValues.port) {
        nextErrors.port = c('Error').t`Port is required`;
    }

    // Override with api errors
    if (apiErrorCode === IMPORT_ERROR.AUTHENTICATION_ERROR) {
        nextErrors.emailAddress = apiErrorMessage;
        nextErrors.password = apiErrorMessage;
    }

    if (IMPORT_ERROR.ACCOUNT_DOES_NOT_EXIST === apiErrorCode || IMPORT_ERROR.IMAP_CONNECTION_ERROR === apiErrorCode) {
        nextErrors.imap = apiErrorMessage;
        nextErrors.port = apiErrorMessage;
    }

    setErrors(Object.keys(nextErrors).length ? nextErrors : undefined);
};
