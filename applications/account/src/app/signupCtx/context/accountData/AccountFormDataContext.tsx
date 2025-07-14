import type { MutableRefObject, ReactNode, RefObject } from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';

import merge from 'lodash/merge';

import type { ChallengeRef, ChallengeResult } from '@proton/components/containers/challenge/interface';
import useApi from '@proton/components/hooks/useApi';
import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { runAfterScroll } from '@proton/shared/lib/dom/runAfterScroll';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';
import {
    confirmPasswordValidator,
    emailValidator,
    passwordLengthValidator,
    requiredValidator,
    usernameCharacterValidator,
    usernameEndCharacterValidator,
    usernameLengthValidator,
    usernameStartCharacterValidator,
} from '@proton/shared/lib/helpers/formValidators';
import isDeepEqual from '@proton/shared/lib/helpers/isDeepEqual';
import isTruthy from '@proton/utils/isTruthy';
import noop from '@proton/utils/noop';

import { usePasswordStrengthIndicatorSpotlight } from '../../../signup/PasswordStrengthIndicatorSpotlight';
import type { AccountData } from '../../../signup/interfaces';
import { SignupType } from '../../../signup/interfaces';
import {
    type AsyncValidationState,
    AsyncValidationStateValue,
    createAsyncValidator,
    defaultAsyncValidationState,
} from './asyncValidator/createAsyncValidator';
import { validateEmailAvailability, validateUsernameAvailability } from './asyncValidator/validateEmail';
import { getAccountDetailsFromEmail } from './getAccountDetailsFromEmail';

const first = <T,>(errors: T[]) => {
    return errors.find((x) => !!x);
};

const usernameAsyncValidator = createAsyncValidator();

interface InputState {
    interactive: boolean;
    focus: boolean;
}

interface AccountFormDataInputState {
    username: Partial<InputState>;
    email: Partial<InputState>;
    password: Partial<InputState>;
    passwordConfirm: Partial<InputState>;
}

interface AccountFormDataState {
    username: string;
    email: string;
    password: string;
    passwordConfirm: string;
    signupType: SignupType | undefined;
    domain: string | undefined;
}

interface AccountFormDataStateRequired extends Omit<AccountFormDataState, 'signupType' | 'domain'> {
    signupType: SignupType;
    signupTypes: Set<SignupType>;
    domain: string;
    domains: string[];
}

export interface ErrorDetails {
    username: string | undefined;
    email: string | undefined;
    password: string | undefined;
    passwordConfirm: string | undefined;
}

interface Props {
    children: ReactNode;
    availableSignupTypes: Set<SignupType>;
    domains: string[];
    defaultEmail?: string;
}

interface Context {
    availableSignupTypes: Props['availableSignupTypes'];
    domains: Props['domains'];
    defaultEmail?: Props['defaultEmail'];
}

const resetValueForChallenge = (setValue: (value: string) => void, value: string) => {
    // If sanitisation happens, force re-render the input with a new value so that the values get removed in the iframe
    flushSync(() => {
        setValue(value + ' ');
    });
    setValue(value);
};

const joinUsernameDomain = (username: string, domain: string) => {
    return [username, '@', domain].join('');
};

const getUsernameError = ({
    username,
    domain,
    usernameValidationState,
}: {
    domain: string;
    username: string;
    usernameValidationState?: AsyncValidationState;
}): ErrorDetails['username'] => {
    const trimmedUsername = username.trim();
    return first([
        joinUsernameDomain(trimmedUsername, domain) === usernameValidationState?.value
            ? usernameValidationState?.message
            : '',
        requiredValidator(trimmedUsername),
        usernameLengthValidator(trimmedUsername),
        usernameStartCharacterValidator(trimmedUsername),
        usernameEndCharacterValidator(trimmedUsername),
        usernameCharacterValidator(trimmedUsername),
    ]);
};

const getEmailError = ({
    email,
    emailValidationState,
}: {
    email: string;
    emailValidationState?: AsyncValidationState;
}): ErrorDetails['email'] => {
    const trimmedEmail = email.trim();
    return first([
        trimmedEmail === emailValidationState?.value ? emailValidationState?.message : '',
        requiredValidator(trimmedEmail),
        emailValidator(trimmedEmail),
    ]);
};

const getPasswordError = ({
    passwords,
    password = '',
    passwordConfirm = '',
}: {
    passwords?: boolean;
    password?: string;
    passwordConfirm?: string;
}): Pick<ErrorDetails, 'password' | 'passwordConfirm'> => {
    return {
        password: passwords ? first([requiredValidator(password), passwordLengthValidator(password)]) : undefined,
        passwordConfirm: passwords
            ? first([requiredValidator(passwordConfirm), confirmPasswordValidator(passwordConfirm, password)])
            : undefined,
    };
};

interface AccountFormDataContextType {
    state: AccountFormDataStateRequired;
    inputStates: AccountFormDataInputState;
    asyncStates: {
        username: AsyncValidationState;
        email: AsyncValidationState;
    };
    errors: ErrorDetails & { emailAlreadyUsed: boolean };
    refs: {
        challenge: MutableRefObject<ChallengeRef | undefined>;
        form: RefObject<HTMLFormElement>;
        email: RefObject<HTMLInputElement>;
        username: RefObject<HTMLInputElement>;
        password: RefObject<HTMLInputElement>;
        passwordConfirm: RefObject<HTMLInputElement>;
    };
    onValue: {
        onUsernameValue: (username: string, domain: string) => void;
        onEmailValue: (email: string, domains: string[]) => void;
        onDetailsDiff: (diff: Partial<AccountFormDataState>) => void;
        onInputsStateDiff: (diff: Partial<AccountFormDataInputState>) => void;
    };
    getIsValid: (options: { passwords: boolean }) => Promise<boolean>;
    getIsValidSync: (options: { passwords: boolean }) => boolean;
    getValidAccountData: (options: { passwords: boolean }) => Promise<AccountData>;
    getAssistVisible: (key: keyof AccountFormDataInputState) => boolean;
    hasSwitchSignupType: boolean;
    hasConfirmPasswordLabel: boolean;
    passwordStrengthIndicatorSpotlight: ReturnType<typeof usePasswordStrengthIndicatorSpotlight>;
    focusEmail: (signupType?: AccountFormDataState['signupType']) => void;
    scrollInto: (target: 'username' | 'email' | 'password' | 'passwordConfirm') => void;
}

const getAssistVisible = (state: Partial<InputState>) => Boolean(state.interactive && state.focus);

const AccountDataContext = createContext<AccountFormDataContextType | null>(null);

interface AccountFormDataContextProviderState {
    values: AccountFormDataState;
    inputStates: AccountFormDataInputState;
    asyncStates: {
        email: AsyncValidationState;
        username: AsyncValidationState;
    };
}

const defaultState: AccountFormDataContextProviderState = {
    values: {
        username: '',
        email: '',
        password: '',
        passwordConfirm: '',

        signupType: undefined,
        domain: undefined,
    },
    inputStates: {
        username: {},
        email: {},
        password: {},
        passwordConfirm: {},
    },
    asyncStates: {
        email: defaultAsyncValidationState,
        username: defaultAsyncValidationState,
    },
};

const getCompleteStateValues = (
    state: AccountFormDataContextProviderState['values'],
    context: Context
): AccountFormDataStateRequired => {
    return merge({}, state, {
        signupTypes: context.availableSignupTypes,
        signupType:
            state.signupType ||
            // Default to first item in set
            context.availableSignupTypes.values().next().value ||
            SignupType.Proton,
        domains: context.domains,
        domain: state.domain || context.domains[0],
    });
};

const getErrorDetails = (
    state: AccountFormDataStateRequired,
    asyncStates: AccountFormDataContextProviderState['asyncStates']
): ErrorDetails => {
    let emailError: ErrorDetails['email'] = undefined;
    let usernameError: ErrorDetails['username'] = undefined;

    const trimmedEmail = state.email.trim();
    const trimmedUsername = state.username.trim();

    if (state.signupType === SignupType.External || state.signupType === SignupType.BringYourOwnEmail) {
        const accountDetails = getAccountDetailsFromEmail({
            email: state.email,
            domains: state.domains,
            defaultDomain: undefined,
        });

        if (accountDetails.signupType === SignupType.Proton) {
            emailError = getUsernameError({
                username: accountDetails.local,
                domain: accountDetails.domain,
                usernameValidationState: asyncStates.email,
            });
        } else {
            emailError = getEmailError({ email: trimmedEmail, emailValidationState: asyncStates.email });
        }
    } else {
        usernameError = getUsernameError({
            username: trimmedUsername,
            domain: state.domain,
            usernameValidationState: asyncStates.username,
        });
    }

    return {
        username: usernameError,
        email: emailError,
        ...getPasswordError({
            passwords: true,
            password: state.password,
            passwordConfirm: state.passwordConfirm,
        }),
    };
};

const getValidationResult = (
    state: AccountFormDataStateRequired,
    asyncStates: AccountFormDataContextProviderState['asyncStates'],
    options: {
        passwords: boolean;
    }
) => {
    const trimmedEmail = state.email.trim();
    const trimmedUsername = state.username.trim();

    const errorDetails = getErrorDetails(state, asyncStates);

    const hasValidAsyncEmailState =
        asyncStates.email.value === trimmedEmail && asyncStates.email.state === AsyncValidationStateValue.Success;
    const hasValidAsyncUsernameState =
        asyncStates.username.value === joinUsernameDomain(trimmedUsername, state.domain) &&
        asyncStates.username.state === AsyncValidationStateValue.Success;

    const fields: (keyof AccountFormDataInputState)[] = (
        [
            (state.signupType === SignupType.External || state.signupType === SignupType.BringYourOwnEmail) &&
            !hasValidAsyncEmailState
                ? 'email'
                : undefined,
            state.signupType === SignupType.Proton && !hasValidAsyncUsernameState ? 'username' : undefined,
            errorDetails.username ? 'username' : undefined,
            errorDetails.email ? 'email' : undefined,
            options.passwords && errorDetails.password ? 'password' : undefined,
            options.passwords && errorDetails.passwordConfirm ? 'passwordConfirm' : undefined,
        ] as const
    ).filter(isTruthy);

    const field = fields[0];
    if (field) {
        return {
            type: 'error' as const,
            fields,
        };
    }

    return {
        type: 'success' as const,
    };
};

const getAccountDataFromState = (state: AccountFormDataStateRequired, payload: ChallengeResult): AccountData => {
    const trimmedEmail = state.email.trim();
    const trimmedUsername = state.username.trim();

    if (state.signupType === SignupType.External) {
        const emailAccountDetails = getAccountDetailsFromEmail({
            email: trimmedEmail,
            domains: state.domains,
            defaultDomain: undefined,
        });

        if (state.signupType === SignupType.External && emailAccountDetails.signupType === SignupType.Proton) {
            return {
                email: trimmedEmail,
                username: emailAccountDetails.local,
                domain: emailAccountDetails.domain,
                signupType: emailAccountDetails.signupType,
                password: state.password,
                payload,
            };
        }
    }

    return {
        email: trimmedEmail,
        username: trimmedUsername,
        domain: state.domain,
        signupType: state.signupType,
        password: state.password,
        payload,
    };
};

const getErrorAssistDetails = (
    inputStates: AccountFormDataContextProviderState['inputStates'],
    asyncStates: AccountFormDataContextProviderState['asyncStates'],
    errorDetails: ErrorDetails
) => {
    const emailAssistError = getAssistVisible(inputStates.email) ? errorDetails.email : undefined;
    const emailAlreadyUsed = Boolean(
        emailAssistError &&
            asyncStates.email.error &&
            getApiError(asyncStates.email.error)?.code === API_CUSTOM_ERROR_CODES.ALREADY_USED
    );

    return {
        username: getAssistVisible(inputStates.username) ? errorDetails.username : undefined,
        email: emailAssistError,
        password: getAssistVisible(inputStates.password) ? errorDetails.password : undefined,
        passwordConfirm: getAssistVisible(inputStates.passwordConfirm) ? errorDetails.passwordConfirm : undefined,
        emailAlreadyUsed,
    };
};

type DeepPartial<T> = T extends object
    ? {
          [P in keyof T]?: DeepPartial<T[P]>;
      }
    : T;

export const AccountFormDataContextProvider = ({ children, availableSignupTypes, domains, defaultEmail }: Props) => {
    const normalApi = useApi();
    const [, setRerender] = useState({});
    const api = useMemo(() => getSilentApi(normalApi), [normalApi]);

    // State
    const accountFormDataContextProviderStateRef = useRef<AccountFormDataContextProviderState>(defaultState);

    // Input values
    const inputValuesRef = useRef({ email: false, username: false });

    // HTML refs
    const challengeRef = useRef<ChallengeRef>();
    const formRef = useRef<HTMLFormElement>(null);
    const emailRef = useRef<HTMLInputElement>(null);
    const usernameRef = useRef<HTMLInputElement>(null);
    const passwordRef = useRef<HTMLInputElement>(null);
    const passwordConfirmRef = useRef<HTMLInputElement>(null);

    // Context (props) refs
    const context: Context = { availableSignupTypes, domains, defaultEmail };
    const contextRef = useRef<Context>(context);
    useEffect(() => {
        contextRef.current = context;
    });

    const passwordStrengthIndicatorSpotlight = usePasswordStrengthIndicatorSpotlight();

    const setStateDiff = useCallback((diff: DeepPartial<AccountFormDataContextProviderState>) => {
        const oldValue = accountFormDataContextProviderStateRef.current;
        const newValue = merge({}, oldValue, diff);
        if (isDeepEqual(oldValue, newValue)) {
            return;
        }
        accountFormDataContextProviderStateRef.current = newValue;
        setRerender({});
    }, []);

    const setInputsStateDiff = useCallback((diff: Partial<AccountFormDataInputState>) => {
        setStateDiff({ inputStates: diff });
    }, []);

    const setAccountDataStateDiff = useCallback((diff: Partial<AccountFormDataState>) => {
        setStateDiff({ values: diff });
    }, []);

    const setUsernameAsyncValidationState = useCallback((state: AsyncValidationState) => {
        setStateDiff({ asyncStates: { username: state } });
    }, []);

    const setEmailAsyncValidationState = useCallback((state: AsyncValidationState) => {
        setStateDiff({ asyncStates: { email: state } });
    }, []);

    const focusChallenge = useCallback((id: '#email' | '#username') => {
        // This is a hack prevent scroll since we'd need to add support for that in challenge
        // TODO: Add support for preventScroll
        const scrollEl = document.body.querySelector('.overflow-auto');
        if (!scrollEl) {
            return;
        }
        runAfterScroll(scrollEl, () => {
            challengeRef.current?.focus(id);
        });
    }, []);

    const scrollInto: AccountFormDataContextType['scrollInto'] = useCallback((target) => {
        if (target === 'email' || target === 'username') {
            formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });

            if (target === 'email') {
                focusChallenge('#email');
            }
            if (target === 'username') {
                focusChallenge('#username');
            }
            return;
        }
        const el = (() => {
            if (target === 'password') {
                return passwordRef.current;
            }
            if (target === 'passwordConfirm') {
                return passwordConfirmRef.current;
            }
            return emailRef.current;
        })();
        if (!el) {
            return;
        }
        el.focus({ preventScroll: true });
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, []);

    const handleEmailError = useCallback((email: string) => {
        const emailError = getEmailError({ email });
        const value = email;
        usernameAsyncValidator.trigger({
            validate: async (value, abortController) => {
                const result = await validateEmailAvailability(value, api, abortController);
                return result;
            },
            error: !!emailError,
            key: `${value}-${SignupType.External}`,
            value,
            set: setEmailAsyncValidationState,
        });
    }, []);

    const handleUsernameError = useCallback(
        (username: string, domain: string, asyncSet = setUsernameAsyncValidationState) => {
            const usernameError = getUsernameError({
                username,
                domain,
            });
            const value = joinUsernameDomain(username, domain);
            usernameAsyncValidator.trigger({
                validate: async (value, abortController) => {
                    const result = await validateUsernameAvailability(value, api, abortController);
                    return result;
                },
                key: `${value}-${SignupType.Proton}`,
                error: !!usernameError,
                value,
                set: asyncSet,
            });
        },
        []
    );

    const onEmailValue = useCallback((value: string, domains: string[]) => {
        inputValuesRef.current.email = true;
        setStateDiff({
            values: { email: value },
            inputStates: { email: { interactive: true } },
        });

        const email = value.trim();
        const accountDetails = getAccountDetailsFromEmail({
            email,
            domains,
            defaultDomain: undefined,
        });
        if (accountDetails.signupType === SignupType.Proton) {
            handleUsernameError(accountDetails.local, accountDetails.domain, setEmailAsyncValidationState);
        } else {
            handleEmailError(email);
        }
    }, []);

    const onUsernameValue = useCallback((value: string, domain: string) => {
        const sanitizedValue = value.replaceAll('@', '');

        inputValuesRef.current.username = true;
        setStateDiff({
            values: { username: sanitizedValue, domain },
            inputStates: { username: { interactive: true } },
        });

        // If sanitisation happens, force re-render the input with a new value so that the values get removed in the iframe
        if (sanitizedValue !== value) {
            resetValueForChallenge((username) => setAccountDataStateDiff({ username }), sanitizedValue);
        }

        handleUsernameError(sanitizedValue.trim(), domain, setUsernameAsyncValidationState);
    }, []);

    const handleDefaultEmail = useCallback(
        (defaultEmail: string | undefined, availableSignupTypes: Set<SignupType>, domains: string[]) => {
            if (!defaultEmail) {
                return;
            }
            const accountDetails = getAccountDetailsFromEmail({
                email: defaultEmail,
                domains,
                defaultDomain: domains[0],
            });
            if (accountDetails.signupType === SignupType.Proton) {
                setAccountDataStateDiff({ signupType: accountDetails.signupType });
                onUsernameValue(accountDetails.local, accountDetails.domain);
                // Ensures the error is displayed
                setInputsStateDiff({ username: { focus: true } });
            } else if (availableSignupTypes.has(SignupType.External)) {
                setAccountDataStateDiff({ signupType: SignupType.External });
                onEmailValue(defaultEmail, domains);
                // Ensures the error is displayed
                setInputsStateDiff({ email: { focus: true } });
            }
        },
        []
    );

    useEffect(() => {
        const handleFocus = () => {
            // This is a hack to get the email input state to be true since onBlur event isn't triggered.
            // Basically any time something else gets focus on the page and the email input has gotten values.
            const keys = ['email', 'username'] as const;
            keys.forEach((key) => {
                if (inputValuesRef.current[key]) {
                    setInputsStateDiff({ [key]: { focus: true } });
                }
            });

            // Done, can remove listener
            if (keys.every((key) => inputValuesRef.current[key])) {
                window.removeEventListener('focus', handleFocus, true);
            }
        };
        window.addEventListener('focus', handleFocus, true);
        return () => {
            window.removeEventListener('focus', handleFocus, true);
        };
    }, []);

    const handleValidation = useCallback(async (options: { passwords: boolean }) => {
        // This waits on a promise that updates the accountFormDataContextProviderStateRef
        await usernameAsyncValidator.pending();

        const { values, asyncStates } = accountFormDataContextProviderStateRef.current;

        const state = getCompleteStateValues(values, contextRef.current);
        const result = getValidationResult(state, asyncStates, options);

        if (result.type === 'error') {
            const value = { interactive: true, focus: true };
            const reset = result.fields.reduce<{ [key in keyof AccountFormDataInputState]?: InputState }>(
                (acc, key) => {
                    acc[key] = value;
                    return acc;
                },
                {}
            );
            setInputsStateDiff(reset);
            const firstField = result.fields[0];
            if (firstField) {
                scrollInto(result.fields[0]);
            }
            throw new Error('Invalid state');
        }
        return { state, result };
    }, []);

    const getIsValid: AccountFormDataContextType['getIsValid'] = useCallback(async (options) => {
        const { result } = await handleValidation(options);
        return result.type === 'success';
    }, []);

    const getIsValidSync: AccountFormDataContextType['getIsValidSync'] = useCallback(
        (options: { passwords: boolean }) => {
            const { values, asyncStates } = accountFormDataContextProviderStateRef.current;
            const state = getCompleteStateValues(values, contextRef.current);
            const result = getValidationResult(state, asyncStates, options);
            return result.type === 'success';
        },
        []
    );

    const getValidAccountData: AccountFormDataContextType['getValidAccountData'] = useCallback(async (options) => {
        const { state, result } = await handleValidation(options);
        if (result.type !== 'success') {
            throw new Error('Invalid state');
        }
        const payload = await challengeRef.current?.getChallenge().catch(noop);
        return getAccountDataFromState(state, payload);
    }, []);

    const accountFormDataContextProviderState = accountFormDataContextProviderStateRef.current;
    const { values, inputStates, asyncStates } = accountFormDataContextProviderState;
    const state = getCompleteStateValues(values, context);
    const errorDetails = getErrorDetails(state, asyncStates);
    const errors = getErrorAssistDetails(inputStates, asyncStates, errorDetails);

    const hasSwitchSignupType = state.signupTypes.has(SignupType.External) && state.signupTypes.size > 1;

    const hasConfirmPasswordLabel =
        passwordStrengthIndicatorSpotlight.supported && !passwordStrengthIndicatorSpotlight.spotlight;

    useEffect(() => {
        if (!defaultEmail) {
            return;
        }
        handleDefaultEmail(defaultEmail, state.signupTypes, state.domains);
    }, [JSON.stringify([defaultEmail, Array.from(state.signupTypes), state.domains])]);

    useEffect(() => {
        if (state.signupType === SignupType.External && state.email) {
            onEmailValue(state.email, state.domains);
        } else if (state.signupType === SignupType.Proton && state.username) {
            onUsernameValue(state.username, state.domain);
        }
    }, [state.signupType]);

    return (
        <AccountDataContext.Provider
            value={{
                state,
                inputStates,
                asyncStates,
                refs: {
                    challenge: challengeRef,
                    form: formRef,
                    email: emailRef,
                    username: usernameRef,
                    password: passwordRef,
                    passwordConfirm: passwordConfirmRef,
                },
                errors,
                onValue: {
                    onUsernameValue,
                    onEmailValue,
                    onInputsStateDiff: setInputsStateDiff,
                    onDetailsDiff: setAccountDataStateDiff,
                },
                getIsValid,
                getIsValidSync,
                getValidAccountData,
                getAssistVisible: useCallback(
                    (key) => getAssistVisible(accountFormDataContextProviderStateRef.current.inputStates[key]),
                    []
                ),
                hasSwitchSignupType,
                hasConfirmPasswordLabel,
                passwordStrengthIndicatorSpotlight,
                focusEmail: useCallback((signupType = state.signupType) => {
                    focusChallenge(signupType === SignupType.External ? '#email' : '#username');
                }, []),
                scrollInto,
            }}
        >
            {children}
        </AccountDataContext.Provider>
    );
};

export const useAccountFormDataContext = () => {
    const state = useContext(AccountDataContext);
    if (!state) {
        throw new Error('Expected to be within AccountFormDataContextProvider');
    }
    return state;
};
