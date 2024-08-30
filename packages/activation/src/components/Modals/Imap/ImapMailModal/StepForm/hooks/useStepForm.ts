import { useEffect, useState } from 'react';

import { updateImport } from '@proton/activation/src/api';
import { AuthenticationMethod, IMPORT_ERROR, ImportType } from '@proton/activation/src/interface';
import { selectImapDraftProduct } from '@proton/activation/src/logic/draft/draft.selector';
import {
    displayConfirmLeaveModal,
    resetImapDraft,
    resumeImapImport,
    submitImapMailCredentials,
} from '@proton/activation/src/logic/draft/imapDraft/imapDraft.actions';
import {
    selectImapDraftMailImport,
    selectImapDraftMailImportApiError,
    selectImapDraftProvider,
} from '@proton/activation/src/logic/draft/imapDraft/imapDraft.selector';
import { useEasySwitchDispatch, useEasySwitchSelector } from '@proton/activation/src/logic/store';
import { useApi } from '@proton/components';
import throttle from '@proton/utils/throttle';

import useAuthInfoByEmail from './useAuthInfoByEmail';
import { getDefaultImap, getDefaultPort, validateStepForm } from './useStepForm.helpers';
import type { StepFormBlur, StepFormErrors, StepFormState } from './useStepForm.interface';

const throttleValidateForm = throttle(validateStepForm, 150);

const useStepForm = () => {
    const api = useApi();

    const dispatch = useEasySwitchDispatch();
    const product = useEasySwitchSelector(selectImapDraftProduct);
    const mailImport = useEasySwitchSelector(selectImapDraftMailImport);
    const apiError = useEasySwitchSelector(selectImapDraftMailImportApiError);
    const importProvider = useEasySwitchSelector(selectImapDraftProvider);
    const [formValues, setFormValues] = useState<StepFormState>({
        emailAddress: mailImport?.email || '',
        password: mailImport?.password || '',
        imap: mailImport?.domain || getDefaultImap(importProvider),
        port: mailImport?.port || getDefaultPort(importProvider),
    });
    /** Tells if form has at least one error */
    const [hasErrors, setHasErrors] = useState<boolean>(false);
    /** Contains the errors messages for each field input */
    const [errors, setErrors] = useState<StepFormErrors>();
    /** True if field input has triggered a blur event */
    const [blurred, setBlurred] = useState<StepFormBlur>({
        emailAddress: false,
        imap: false,
        password: false,
        port: false,
    });

    const handleSubmit = async () => {
        if (hasErrors) {
            return;
        }

        const { emailAddress, imap, port, password } = formValues;
        const allowSelfSigned = apiError?.code === IMPORT_ERROR.IMAP_CONNECTION_ERROR;

        if (mailImport?.step === 'reconnect-form') {
            if (!mailImport.apiImporterID || !product) {
                throw new Error('Missing importerID or product');
            }

            await api(
                updateImport(mailImport.apiImporterID, {
                    [ImportType.MAIL]: {
                        Account: emailAddress,
                        ImapHost: imap,
                        ImapPort: parseInt(port, 10),
                        Code: password,
                        Sasl: AuthenticationMethod.PLAIN,
                        AllowSelfSigned: allowSelfSigned ? 1 : 0,
                    },
                })
            );

            return dispatch(
                resumeImapImport({
                    importID: mailImport.apiImporterID,
                    product,
                })
            );
        } else {
            return dispatch(
                submitImapMailCredentials({
                    email: emailAddress,
                    password: password,
                    domain: imap,
                    port,
                    allowSelfSigned,
                })
            );
        }
    };

    const handleCancel = () => {
        const shouldDisplayConfirmModal = mailImport?.step !== 'reconnect-form' && formValues.emailAddress;

        if (shouldDisplayConfirmModal) {
            dispatch(displayConfirmLeaveModal(true));
        } else {
            dispatch(resetImapDraft());
        }
    };

    useAuthInfoByEmail(formValues.emailAddress, (result) => {
        if (result.Authentication) {
            setFormValues((formValues) => ({
                ...formValues,
                imap: formValues.imap ? formValues.imap : result.Authentication.ImapHost || '',
                port: formValues.port ? formValues.port : `${result.Authentication.ImapPort}` || '',
            }));
        }
    });

    useEffect(() => {
        throttleValidateForm(formValues, blurred, setErrors, setHasErrors, apiError?.code, apiError?.message);
    }, [formValues, blurred, apiError?.code]);

    return {
        isConnectingToProvider: !!mailImport?.loading,
        formValues,
        setFormValues,
        hasErrors,
        errors,
        blurred,
        setBlurred,
        handleSubmit,
        handleCancel,
    };
};

export default useStepForm;
