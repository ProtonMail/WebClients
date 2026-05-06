import { useState } from 'react';

import { useSelector } from '@proton/redux-shared-store/sharedProvider';
import getRandomString from '@proton/utils/getRandomString';

import {
    getDefaultWaitTimeOptionValue,
    getWaitTimeOptions,
} from '../../emergencyContact/outgoing/modals/getWaitTimeOptions';
import { selectCreateOutgoingDelegatedAccessData } from './selector';

interface AddContactInputData {
    id: string;
    email: string;
    waitTime: number;
    emailError: string;
    asyncError: string;
}

const getAddContactInputData = (): AddContactInputData => {
    return {
        id: getRandomString(12),
        email: '',
        waitTime: getDefaultWaitTimeOptionValue(),
        emailError: '',
        asyncError: '',
    };
};

export const useAddContactInputs = () => {
    const createOutgoingDelegatedAccessData = useSelector(selectCreateOutgoingDelegatedAccessData);

    const [inputs, setInputs] = useState<AddContactInputData[]>(() => {
        return [getAddContactInputData()];
    });
    const [submitted, setSubmitted] = useState<boolean>(false);
    const [asyncError, setAsyncError] = useState<{ email: string; errorMessage: string } | null>(null);
    const waitTimeOptions = getWaitTimeOptions();

    const inputsWithErrors = inputs.map((contact): AddContactInputData => {
        if (contact.email === asyncError?.email) {
            return {
                ...contact,
                asyncError: asyncError?.errorMessage,
            };
        }
        return contact;
    });

    const hasError = inputsWithErrors.some((contact) => !!contact.emailError || contact.asyncError);

    return {
        asyncError,
        setAsyncError,
        submitted,
        setSubmitted,
        hasError,
        waitTimeOptions,
        createOutgoingDelegatedAccessData,
        inputs: inputsWithErrors,
        setInputs: (id: string, diff: Partial<AddContactInputData>) => {
            return setInputs((oldState) => {
                return oldState.map((data) => {
                    if (data.id === id) {
                        return {
                            ...data,
                            ...diff,
                        };
                    }
                    return data;
                });
            });
        },
        addInput: () => {
            return setInputs((oldState) => {
                return [...oldState, getAddContactInputData()];
            });
        },
        removeInput: (id: string) => {
            return setInputs((oldState) => {
                return oldState.filter((input) => input.id !== id);
            });
        },
    };
};
