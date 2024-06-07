import { useState } from 'react';

export enum AssistantErrorTypes {
    globalError,
    specificError,
}

export interface AssistantGlobalError {
    type: AssistantErrorTypes.globalError;
}

export interface AssistantSpecificError {
    type: AssistantErrorTypes.specificError;
    assistantID: string;
}

export type AssistantError = (AssistantGlobalError | AssistantSpecificError) & {
    error: string;
};

const useAssistantErrors = () => {
    const [errors, setErrors] = useState<AssistantError[]>([]);

    const addSpecificError = ({ assistantID, errorMessage }: { assistantID: string; errorMessage: string }) => {
        const newError: AssistantError = {
            type: AssistantErrorTypes.specificError,
            assistantID,
            error: errorMessage,
        };

        setErrors([...errors, newError]);
    };

    const addGlobalError = (errorMessage: string) => {
        const newError: AssistantError = {
            type: AssistantErrorTypes.globalError,
            error: errorMessage,
        };

        setErrors([...errors, newError]);
    };

    const cleanSpecificErrors = (assistantID: string) => {
        const filteredErrors = errors.filter((error) => {
            if (error.type === AssistantErrorTypes.specificError) {
                return error.assistantID !== assistantID;
            }
            return error;
        });

        setErrors(filteredErrors);
    };

    const cleanGlobalErrors = () => {
        const filteredErrors = errors.filter((error) => {
            return error.type !== AssistantErrorTypes.globalError;
        });

        setErrors(filteredErrors);
    };

    return { errors, addSpecificError, cleanSpecificErrors, addGlobalError, cleanGlobalErrors };
};

export default useAssistantErrors;
