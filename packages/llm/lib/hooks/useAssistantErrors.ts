import { useState } from 'react';

import { c } from 'ttag';

import useAssistantTelemetry from '@proton/components/hooks/assistant/useAssistantTelemetry';
import { ASSISTANT_TYPE, ERROR_TYPE } from '@proton/shared/lib/assistant';

export enum AssistantErrorTypes {
    globalError,
    specificError,
}

interface AssistantGlobalError {
    type: AssistantErrorTypes.globalError;
}

interface AssistantSpecificError {
    type: AssistantErrorTypes.specificError;
    assistantID: string;
}

export type AssistantError = (AssistantGlobalError | AssistantSpecificError) & {
    error: string;
    errorType?: ERROR_TYPE;
};

const getErrorMessage = (errorType: ERROR_TYPE, assistantType: ASSISTANT_TYPE) => {
    if (errorType === ERROR_TYPE.GENERATION_HARMFUL) {
        return c('Error').t`The writing assistant cannot proceed with your request. Please try a different prompt.`;
    }

    if (errorType === ERROR_TYPE.TOO_MANY_REQUESTS) {
        return c('Error').t`The system is busy at the moment. Please try again in a few minutes.`;
    }

    if (errorType === ERROR_TYPE.GENERATION_FAIL && assistantType === ASSISTANT_TYPE.LOCAL) {
        // There is a bug where the LLM will be unloaded from the GPU
        // without notice. It hasn't been tracked down, in this scenario
        // the user might want to refresh.
        // The wording should be aligned with server mode when the issue is solved
        return c('Error').t`Please try again or refresh the page.`;
    }

    if (errorType === ERROR_TYPE.GENERATION_FAIL) {
        return c('Error').t`Please try generating the text again`;
    }

    if (errorType === ERROR_TYPE.GENERATION_CANCEL_FAIL) {
        return c('Error').t`Due to an error, text generation couldn't be canceled`;
    }

    if (errorType === ERROR_TYPE.CACHING_FAILED) {
        return c('Error')
            .t`Problem downloading the writing assistant. If you're using private mode, try using normal browsing mode or run the writing assistant on servers.`;
    }

    if (errorType === ERROR_TYPE.DOWNLOAD_FAIL || errorType === ERROR_TYPE.DOWNLOAD_REQUEST_FAIL) {
        return c('Error').t`Problem downloading the writing assistant. Please try again.`;
    }

    if (errorType === ERROR_TYPE.LOADGPU_FAIL) {
        return c('Error').t`Problem loading the writing assistant to your device. Please try again.`;
    }

    if (errorType === ERROR_TYPE.UNLOAD_FAIL) {
        return c('Error').t`Problem unloading data not needed when the writing assistant is inactive`;
    }

    if (errorType === ERROR_TYPE.GENERATION_TOO_LONG) {
        return c('Error').t`Text is too long to refine`;
    }

    throw new Error('Unknown error type');
};

const useAssistantErrors = () => {
    const [errors, setErrors] = useState<AssistantError[]>([]);

    const { sendAssistantErrorReport } = useAssistantTelemetry();

    const addSpecificError = ({
        assistantID,
        assistantType,
        errorType,
    }: {
        assistantID: string;
        assistantType: ASSISTANT_TYPE;
        errorType: ERROR_TYPE;
    }) => {
        const newError: AssistantError = {
            type: AssistantErrorTypes.specificError,
            assistantID,
            error: getErrorMessage(errorType, assistantType),
            errorType,
        };

        sendAssistantErrorReport({
            assistantType,
            errorType,
        });

        setErrors((errors) => [...errors, newError]);
    };

    const addGlobalError = (assistantType: ASSISTANT_TYPE, errorType: ERROR_TYPE) => {
        const errorMessage = getErrorMessage(errorType, assistantType);
        const newError: AssistantError = {
            type: AssistantErrorTypes.globalError,
            error: getErrorMessage(errorType, assistantType),
            errorType,
        };

        sendAssistantErrorReport({
            assistantType,
            errorType,
        });

        setErrors((errors) => [...errors, newError]);

        return errorMessage;
    };

    const cleanSpecificErrors = (assistantID: string) => {
        setErrors((errors) => {
            return errors.filter((error) => {
                if (error.type === AssistantErrorTypes.specificError) {
                    return error.assistantID !== assistantID;
                }
                return error;
            });
        });
    };

    const cleanGlobalErrors = () => {
        setErrors((errors) => {
            return errors.filter((error) => {
                return error.type !== AssistantErrorTypes.globalError;
            });
        });
    };

    return { errors, addSpecificError, cleanSpecificErrors, addGlobalError, cleanGlobalErrors };
};

export default useAssistantErrors;
