import type { KeyboardEvent, MutableRefObject, ReactNode } from 'react';
import { useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { flushSync } from 'react-dom';

import { c } from 'ttag';

import { CircleLoader, InlineLinkButton } from '@proton/atoms';
import type { ChallengeRef } from '@proton/components';
import { Challenge, DropdownSizeUnit, Icon, Info, InputFieldTwo, PasswordInputTwo } from '@proton/components';
import Option from '@proton/components/components/option/Option';
import SelectTwo from '@proton/components/components/selectTwo/SelectTwo';
import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { TelemetryAccountSignupEvents } from '@proton/shared/lib/api/telemetry';
import { BRAND_NAME, CALENDAR_APP_NAME, MAIL_APP_NAME, PLANS } from '@proton/shared/lib/constants';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';
import {
    confirmPasswordValidator,
    emailValidator,
    getMinPasswordLengthMessage,
    passwordLengthValidator,
    requiredValidator,
    usernameCharacterValidator,
    usernameEndCharacterValidator,
    usernameLengthValidator,
    usernameStartCharacterValidator,
} from '@proton/shared/lib/helpers/formValidators';
import isDeepEqual from '@proton/shared/lib/helpers/isDeepEqual';
import type { Api } from '@proton/shared/lib/interfaces';
import clsx from '@proton/utils/clsx';
import isTruthy from '@proton/utils/isTruthy';
import noop from '@proton/utils/noop';

import { usePublicTheme } from '../containers/PublicThemeProvider';
import type { AccountData } from '../signup/interfaces';
import { SignupType } from '../signup/interfaces';
import { getAccountDetailsFromEmail } from './accountDetails';
import { runAfterScroll } from './helper';
import type { BaseMeasure, SignupModelV2 } from './interface';
import type { AvailableExternalEvents, InteractCreateEvents, InteractFields, UserCheckoutEvents } from './measure';
import type { AsyncValidationState } from './validateEmail';
import {
    AsyncValidationStateValue,
    createAsyncValidator,
    defaultAsyncValidationState,
    validateEmailAvailability,
    validateUsernameAvailability,
} from './validateEmail';

import '../signup/AccountStep.scss';

const first = <T,>(errors: T[]) => {
    return errors.find((x) => !!x);
};

const usernameAsyncValidator = createAsyncValidator();

interface InputState {
    interactive: boolean;
    focus: boolean;
}

interface AccountDetailsInputState {
    username: Partial<InputState>;
    email: Partial<InputState>;
    password: Partial<InputState>;
    passwordConfirm: Partial<InputState>;
}

interface AccountDetails {
    username: string;
    email: string;
    password: string;
    passwordConfirm: string;
}

export interface ErrorDetails {
    username: string | undefined;
    email: string | undefined;
    password: string | undefined;
    passwordConfirm: string | undefined;
}

const getDefaultInputs = ({
    defaultUsername = '',
    defaultEmail = '',
}: {
    defaultUsername?: string;
    defaultEmail?: string;
} = {}) => ({
    username: defaultUsername,
    email: defaultEmail,
    password: '',
    passwordConfirm: '',
});

const getDefaultInputStates = ({ username, email, password, passwordConfirm }: AccountDetails) => ({
    username: !!username ? { interactive: true, focus: true } : {},
    email: !!email ? { interactive: true, focus: true } : {},
    password: !!password ? { interactive: true, focus: true } : {},
    passwordConfirm: !!passwordConfirm ? { interactive: true, focus: true } : {},
});

export interface AccountStepDetailsRef {
    validate: () => boolean;
    data: () => Promise<AccountData>;
    scrollInto: (target: 'email' | 'password' | 'passwordConfirm') => void;
}

const getMeasurement = (diff: Partial<AccountDetailsInputState>) => {
    return Object.entries(diff)
        .map(([_key, value]) => {
            const key = _key as keyof typeof diff;
            const field: InteractFields | undefined = (() => {
                if (key === 'username') {
                    return 'username';
                }
                if (key === 'email') {
                    return 'email';
                }
                if (key === 'password') {
                    return 'pwd';
                }
                if (key === 'passwordConfirm') {
                    return 'pwd_confirm';
                }
            })();
            if (field && value?.focus) {
                return {
                    event: TelemetryAccountSignupEvents.interactAccountCreate,
                    dimensions: { field },
                } as const;
            }
        })
        .filter(isTruthy);
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

interface Props {
    accountStepDetailsRef: MutableRefObject<AccountStepDetailsRef | undefined>;
    disableChange: boolean;
    emailDisabled?: boolean;
    emailReadOnly?: boolean;
    onSubmit?: () => void;
    api: Api;
    model: SignupModelV2;
    onChallengeLoaded: () => void;
    onChallengeError: () => void;
    loading: boolean;
    measure: BaseMeasure<InteractCreateEvents | UserCheckoutEvents | AvailableExternalEvents>;
    passwordFields: boolean;
    footer: (data: { emailAlreadyUsed: boolean; details: AccountDetails; email: string }) => ReactNode;
    defaultEmail?: string;
    signupTypes: SignupType[];
    domains: string[];
}

const AccountStepDetails = ({
    signupTypes,
    domains,
    loading,
    accountStepDetailsRef,
    disableChange,
    emailDisabled,
    emailReadOnly,
    footer,
    api,
    model,
    onSubmit,
    onChallengeLoaded,
    onChallengeError,
    measure,
    passwordFields,
    defaultEmail,
}: Props) => {
    const [, setRerender] = useState<any>();
    const [signupType, setSignupType] = useState(signupTypes[0]);
    const anchorRef = useRef<HTMLButtonElement | null>(null);
    const challengeRefEmail = useRef<ChallengeRef>();
    const formInputRef = useRef<HTMLFormElement>(null);
    const inputValuesRef = useRef({ email: false, username: false });
    const domainOptions = domains.map((DomainName) => ({ text: DomainName, value: DomainName }));
    const [maybeDomain, setDomain] = useState(domains?.[0] || ''); // This is set while domains are loading
    const theme = usePublicTheme();

    const domain = maybeDomain || domains?.[0];

    const [details, setDetails] = useState<AccountDetails>(getDefaultInputs({}));
    const [states, setStates] = useState<AccountDetailsInputState>(getDefaultInputStates(details));

    const trimmedEmail = details.email.trim();
    const trimmedUsername = details.username.trim();

    const [emailAsyncValidationState, setEmailAsyncValidationState] =
        useState<AsyncValidationState>(defaultAsyncValidationState);
    const [usernameAsyncValidationState, setUsernameAsyncValidationState] =
        useState<AsyncValidationState>(defaultAsyncValidationState);

    const emailRef = useRef<HTMLInputElement>(null);
    const usernameRef = useRef<HTMLInputElement>(null);
    const passwordRef = useRef<HTMLInputElement>(null);
    const passwordConfirmRef = useRef<HTMLInputElement>(null);

    const setInputsStateDiff = useCallback((diff: Partial<AccountDetailsInputState>) => {
        setStates((old) => {
            const result = {
                ...old,
                ...Object.keys(diff).reduce<Partial<AccountDetailsInputState>>((acc, _key) => {
                    const key = _key as keyof AccountDetailsInputState;
                    acc[key] = {
                        ...old[key],
                        ...diff[key],
                    };
                    return acc;
                }, {}),
            };
            if (isDeepEqual(result, old)) {
                return old;
            }

            setTimeout(() => {
                getMeasurement(diff).forEach(measure);
            }, 1);
            return result;
        });
    }, []);

    const setInputsDiff = useCallback((diff: Partial<AccountDetails>) => {
        setDetails((old) => {
            const result = {
                ...old,
                ...Object.keys(diff).reduce<Partial<AccountDetails>>((acc, _key) => {
                    const key = _key as keyof AccountDetails;
                    acc[key] = diff[key];
                    return acc;
                }, {}),
            };
            if (isDeepEqual(result, old)) {
                return old;
            }
            return result;
        });
    }, []);

    const focusChallenge = (id: '#email' | '#username') => {
        // This is a hack prevent scroll since we'd need to add support for that in challenge
        // TODO: Add support for preventScroll
        const scrollEl = document.body.querySelector('.overflow-auto');
        if (!scrollEl) {
            return;
        }
        runAfterScroll(scrollEl, () => {
            challengeRefEmail.current?.focus(id);
        });
    };

    const scrollInto = (target: 'username' | 'email' | 'password' | 'passwordConfirm') => {
        if (target === 'email' || target === 'username') {
            formInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });

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
    };

    const errorDetails = (() => {
        let emailError: ErrorDetails['email'] = undefined;
        let usernameError: ErrorDetails['username'] = undefined;

        if (signupType === SignupType.Email) {
            const accountDetails = getAccountDetailsFromEmail({
                email: details.email,
                domains,
                defaultDomain: undefined,
            });

            if (accountDetails.signupType === SignupType.Username) {
                emailError = getUsernameError({
                    username: accountDetails.local,
                    domain: accountDetails.domain,
                    usernameValidationState: emailAsyncValidationState,
                });
            } else {
                emailError = getEmailError({ email: trimmedEmail, emailValidationState: emailAsyncValidationState });
            }
        } else {
            usernameError = getUsernameError({
                username: trimmedUsername,
                domain,
                usernameValidationState: usernameAsyncValidationState,
            });
        }

        return {
            username: usernameError,
            email: emailError,
            ...getPasswordError({
                passwords: passwordFields,
                password: details.password,
                passwordConfirm: details.passwordConfirm,
            }),
        };
    })();

    const validateAccountDetails = () => {
        const fields = ((): (keyof AccountDetailsInputState)[] => {
            const hasValidAsyncEmailState =
                emailAsyncValidationState.value === trimmedEmail &&
                emailAsyncValidationState.state === AsyncValidationStateValue.Success;
            const hasValidAsyncUsernameState =
                usernameAsyncValidationState.value === joinUsernameDomain(trimmedUsername, domain) &&
                usernameAsyncValidationState.state === AsyncValidationStateValue.Success;

            return (
                [
                    signupType === SignupType.Email && !hasValidAsyncEmailState ? 'email' : undefined,
                    signupType === SignupType.Username && !hasValidAsyncUsernameState ? 'username' : undefined,
                    errorDetails.username ? 'username' : undefined,
                    errorDetails.email ? 'email' : undefined,
                    errorDetails.password ? 'password' : undefined,
                    errorDetails.passwordConfirm ? 'passwordConfirm' : undefined,
                ] as const
            ).filter(isTruthy);
        })();

        const field = fields[0];
        if (field) {
            const value = { interactive: true, focus: true };
            const reset = fields.reduce<{ [key in keyof AccountDetailsInputState]?: InputState }>((acc, key) => {
                acc[key] = value;
                return acc;
            }, {});
            setInputsStateDiff(reset);
            scrollInto(field);
            return false;
        }
        return true;
    };

    const addAvailabilityMonitoring = (result: AsyncValidationState) => {
        if (result.state === AsyncValidationStateValue.Success || result.state === AsyncValidationStateValue.Fatal) {
            const available = result.state === AsyncValidationStateValue.Fatal ? 'no' : 'yes';
            measure({
                event: TelemetryAccountSignupEvents.beAvailableExternal,
                dimensions: { available },
            });
        }
    };

    const handleEmailError = (email: string, asyncSet = setEmailAsyncValidationState) => {
        const emailError = getEmailError({
            email,
        });
        usernameAsyncValidator.trigger({
            validate: async (value, abortController) => {
                const result = await validateEmailAvailability(value, api, abortController);
                addAvailabilityMonitoring(result);
                return result;
            },
            error: !!emailError,
            value: email,
            set: asyncSet,
        });
    };

    const handleUsernameError = (username: string, domain: string, asyncSet = setUsernameAsyncValidationState) => {
        const usernameError = getUsernameError({
            username,
            domain,
        });
        usernameAsyncValidator.trigger({
            validate: async (value, abortController) => {
                const result = await validateUsernameAvailability(value, api, abortController);
                addAvailabilityMonitoring(result);
                return result;
            },
            error: !!usernameError,
            value: joinUsernameDomain(username, domain),
            set: asyncSet,
        });
    };

    const onEmailValue = (value: string) => {
        inputValuesRef.current.email = true;
        setInputsStateDiff({ email: { interactive: true } });
        setInputsDiff({ email: value });
        const email = value.trim();
        const accountDetails = getAccountDetailsFromEmail({
            email,
            domains,
            defaultDomain: undefined,
        });
        if (accountDetails.signupType === SignupType.Username) {
            handleUsernameError(accountDetails.local, accountDetails.domain, setEmailAsyncValidationState);
        } else {
            handleEmailError(email);
        }
    };

    const onUsernameValue = (value: string, domain: string) => {
        const sanitizedValue = value.replaceAll('@', '');

        inputValuesRef.current.username = true;
        setInputsStateDiff({ username: { interactive: true } });
        setInputsDiff({ username: sanitizedValue });
        setDomain(domain);

        // If sanitisation happens, force re-render the input with a new value so that the values get removed in the iframe
        if (sanitizedValue !== value) {
            flushSync(() => {
                setInputsDiff({ username: `${value} ` });
            });
            setInputsDiff({ username: sanitizedValue });
        }

        handleUsernameError(sanitizedValue.trim(), domain, setUsernameAsyncValidationState);
    };

    useImperativeHandle(accountStepDetailsRef, () => ({
        validate: () => {
            return validateAccountDetails();
        },
        data: async (): Promise<AccountData> => {
            const payload = await challengeRefEmail.current?.getChallenge().catch(noop);

            if (signupType === SignupType.Email) {
                const emailAccountDetails = getAccountDetailsFromEmail({
                    email: trimmedEmail,
                    domains,
                    defaultDomain: undefined,
                });

                if (signupType === SignupType.Email && emailAccountDetails.signupType === SignupType.Username) {
                    return {
                        email: trimmedEmail,
                        username: emailAccountDetails.local,
                        domain: emailAccountDetails.domain,
                        signupType: emailAccountDetails.signupType,
                        password: details.password,
                        payload,
                    };
                }
            }

            return {
                email: trimmedEmail,
                username: trimmedUsername,
                domain,
                signupType,
                password: details.password,
                payload,
            };
        },
        scrollInto,
    }));

    useEffect(() => {
        const handleFocus = () => {
            // This a hack to get the email input state to be true since onBlur event isn't triggered.
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

    useEffect(() => {
        if (!domains.length || !defaultEmail) {
            return;
        }
        const accountDetails = getAccountDetailsFromEmail({
            email: defaultEmail,
            domains,
            defaultDomain: domain,
        });
        if (accountDetails.signupType === SignupType.Username) {
            setSignupType(accountDetails.signupType);
            onUsernameValue(accountDetails.local, accountDetails.domain);
            // Ensures the error is displayed
            setInputsStateDiff({ username: { focus: true } });
        } else if (signupTypes.includes(SignupType.Email)) {
            setSignupType(SignupType.Email);
            onEmailValue(defaultEmail);
            // Ensures the error is displayed
            setInputsStateDiff({ email: { focus: true } });
        }
    }, [defaultEmail, domains]);

    const getAssistVisible = (state: Partial<InputState>) => state.interactive && state.focus;
    const usernameError = getAssistVisible(states.username) ? errorDetails.username : undefined;
    const emailError = getAssistVisible(states.email) ? errorDetails.email : undefined;
    const passwordError = getAssistVisible(states.password) ? errorDetails.password : undefined;
    const passwordConfirmError = getAssistVisible(states.passwordConfirm) ? errorDetails.passwordConfirm : undefined;

    const inputsWrapper = 'flex flex-column';
    const hasSwitchSignupType = signupTypes.includes(SignupType.Email) && signupTypes.length > 1;
    const dense = !passwordFields && signupTypes.length <= 1;

    const handleSubmit = () => {
        // Not valid
        if (!onSubmit) {
            return;
        }
        measure({
            event: TelemetryAccountSignupEvents.userCheckout,
            dimensions: {
                type: 'free',
                plan: PLANS.FREE,
                cycle: `${model.subscriptionData.cycle}`,
                currency: model.subscriptionData.currency,
            },
        });
        if (validateAccountDetails()) {
            onSubmit();
        }
    };

    const emailAlreadyUsed =
        emailError &&
        emailAsyncValidationState.error &&
        getApiError(emailAsyncValidationState.error)?.code === API_CUSTOM_ERROR_CODES.ALREADY_USED;

    return (
        <>
            {loading && (
                <div className="text-center absolute inset-center">
                    <CircleLoader size="medium" />
                </div>
            )}
            <form
                className={loading ? 'visibility-hidden' : undefined}
                ref={formInputRef}
                name="account-form"
                onSubmit={async (event) => {
                    event.preventDefault();
                    handleSubmit();
                }}
            >
                {/*This is attempting to position at the same place as the select since it's in the challenge iframe*/}
                <div className="relative">
                    <div
                        ref={anchorRef as any}
                        className="absolute top-custom right-custom"
                        style={{
                            '--right-custom': '6px',
                            '--top-custom': '53px', // Magic values where the select will be
                        }}
                    />
                </div>
                <div className={`${inputsWrapper} mb-4`}>
                    <Challenge
                        bodyClassName="color-norm bg-transparent px-2"
                        iframeClassName="challenge-width-increase"
                        challengeRef={challengeRefEmail}
                        type={0}
                        hasSizeObserver
                        title={c('Signup label').t`Email address`}
                        name="email"
                        onSuccess={() => {
                            onChallengeLoaded();
                        }}
                        onError={() => {
                            onChallengeLoaded();
                            onChallengeError();
                        }}
                    >
                        <div className={clsx(inputsWrapper, theme.dark && 'ui-prominent', 'bg-transparent')}>
                            {signupType === SignupType.Email && (
                                <InputFieldTwo
                                    ref={emailRef}
                                    id="email"
                                    label={c('Signup label').t`Email address`}
                                    inputClassName="email-input-field"
                                    error={emailError}
                                    suffix={(() => {
                                        if (emailError) {
                                            return undefined;
                                        }
                                        if (emailAsyncValidationState.state === AsyncValidationStateValue.Success) {
                                            return (
                                                <Icon
                                                    name="checkmark-circle"
                                                    className="color-success"
                                                    size={4}
                                                    data-testid="email-valid"
                                                />
                                            );
                                        }
                                        if (
                                            emailAsyncValidationState.state === AsyncValidationStateValue.Loading &&
                                            getAssistVisible(states.email)
                                        ) {
                                            return <CircleLoader size="small" />;
                                        }
                                    })()}
                                    disableChange={disableChange}
                                    disabled={emailDisabled}
                                    readOnly={emailReadOnly}
                                    dense={dense ? !emailError : undefined}
                                    rootClassName={dense ? (!emailError ? 'pb-2' : undefined) : undefined}
                                    value={details.email}
                                    onValue={onEmailValue}
                                    onBlur={() => {
                                        // Doesn't work because it's in the challenge
                                        setInputsStateDiff({ email: { focus: true } });
                                    }}
                                    onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
                                        if (event.key === 'Enter') {
                                            handleSubmit();
                                        }
                                        if (event.key === 'Tab') {
                                            setInputsStateDiff({ email: { focus: true } });
                                        }
                                    }}
                                />
                            )}

                            {signupType === SignupType.Username && (
                                <InputFieldTwo
                                    ref={usernameRef}
                                    id="username"
                                    label={c('Signup label').t`Username`}
                                    error={usernameError}
                                    autoFocus
                                    inputClassName="email-input-field"
                                    suffix={(() => {
                                        const asyncState = (() => {
                                            const wrap = (child: ReactNode) => {
                                                return (
                                                    <div
                                                        className="w-custom text-center"
                                                        style={{
                                                            '--w-custom': '1.5rem',
                                                        }}
                                                    >
                                                        {child}
                                                    </div>
                                                );
                                            };
                                            if (
                                                usernameAsyncValidationState.state === AsyncValidationStateValue.Success
                                            ) {
                                                return wrap(
                                                    <Icon
                                                        name="checkmark-circle"
                                                        className="color-success"
                                                        size={4}
                                                        data-testid="email-valid"
                                                    />
                                                );
                                            }
                                            if (
                                                usernameAsyncValidationState.state ===
                                                    AsyncValidationStateValue.Loading &&
                                                getAssistVisible(states.username)
                                            ) {
                                                return wrap(<CircleLoader size="small" />);
                                            }
                                        })();

                                        if (domains.length === 1) {
                                            const value = `@${domain}`;
                                            return (
                                                <>
                                                    <span className="text-ellipsis" title={value}>
                                                        {value}
                                                    </span>
                                                    {asyncState}
                                                </>
                                            );
                                        }
                                        return (
                                            <>
                                                <SelectTwo
                                                    id="select-domain"
                                                    originalPlacement="bottom-end"
                                                    anchorRef={anchorRef}
                                                    size={{ width: DropdownSizeUnit.Static }}
                                                    unstyled
                                                    onOpen={() => setRerender({})}
                                                    onClose={() => setRerender({})}
                                                    value={domain}
                                                    onChange={({ value }) => {
                                                        onUsernameValue(trimmedUsername, value);
                                                    }}
                                                >
                                                    {domainOptions.map((option) => (
                                                        <Option
                                                            key={option.value}
                                                            value={option.value}
                                                            title={option.text}
                                                        >
                                                            @{option.text}
                                                        </Option>
                                                    ))}
                                                </SelectTwo>
                                                {asyncState}
                                            </>
                                        );
                                    })()}
                                    disableChange={disableChange}
                                    dense={dense ? !usernameError : undefined}
                                    rootClassName={dense ? (!usernameError ? 'pb-2' : undefined) : undefined}
                                    value={details.username}
                                    onValue={(value: string) => {
                                        onUsernameValue(value, domain);
                                    }}
                                    onBlur={() => {
                                        // Doesn't work because it's in the challenge
                                        setInputsStateDiff({ username: { focus: true } });
                                    }}
                                    onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
                                        if (event.key === 'Enter') {
                                            handleSubmit();
                                        }
                                        if (event.key === 'Tab') {
                                            setInputsStateDiff({ username: { focus: true } });
                                        }
                                    }}
                                />
                            )}
                        </div>
                    </Challenge>

                    {hasSwitchSignupType ? (
                        <div className={clsx('text-center', loading && 'hidden')}>
                            <InlineLinkButton
                                id="existing-email-button"
                                onClick={() => {
                                    setSignupType(
                                        (() => {
                                            if (signupType === SignupType.Username) {
                                                return SignupType.Email;
                                            }
                                            return signupTypes.find((type) => type !== signupType) || signupType;
                                        })()
                                    );
                                    setInputsDiff({ email: '', username: '' });
                                }}
                            >
                                {signupType === SignupType.Email
                                    ? c('Action').t`Get a new encrypted email address`
                                    : c('Action').t`Use your current email instead`}
                            </InlineLinkButton>
                            <Info
                                buttonTabIndex={-1}
                                className="ml-2"
                                title={
                                    signupType === SignupType.Email
                                        ? c('Info')
                                              .t`With an encrypted ${BRAND_NAME} address, you can use all ${BRAND_NAME} services`
                                        : c('Info')
                                              .t`You will need a ${BRAND_NAME} address to use ${MAIL_APP_NAME} and ${CALENDAR_APP_NAME}`
                                }
                            />
                        </div>
                    ) : null}

                    {passwordFields && (
                        <>
                            <InputFieldTwo
                                ref={passwordRef}
                                id="password"
                                as={PasswordInputTwo}
                                assistiveText={states.password.focus && getMinPasswordLengthMessage()}
                                label={c('Signup label').t`Password`}
                                error={passwordError}
                                dense={!passwordError}
                                rootClassName={clsx(hasSwitchSignupType ? 'mt-4' : 'mt-2', !passwordError && 'pb-2')}
                                disableChange={disableChange}
                                value={details.password}
                                autoComplete="new-password"
                                onValue={(value: string) => {
                                    setInputsDiff({ password: value });
                                    setInputsStateDiff({ password: { interactive: true } });
                                }}
                                onBlur={() => {
                                    setInputsStateDiff({ password: { focus: true } });
                                }}
                            />
                            {states.password.interactive && (
                                <InputFieldTwo
                                    ref={passwordConfirmRef}
                                    id="password-confirm"
                                    as={PasswordInputTwo}
                                    placeholder={c('Signup label').t`Confirm password`}
                                    error={passwordConfirmError}
                                    dense={!passwordConfirmError}
                                    rootClassName={clsx(passwordError && 'pt-2')}
                                    disableChange={disableChange}
                                    value={details.passwordConfirm}
                                    autoComplete="new-password"
                                    onValue={(value: string) => {
                                        setInputsDiff({ passwordConfirm: value });
                                        setInputsStateDiff({ passwordConfirm: { interactive: true } });
                                    }}
                                    onBlur={() => {
                                        setInputsStateDiff({ passwordConfirm: { focus: true } });
                                    }}
                                />
                            )}
                        </>
                    )}
                </div>
                {footer({
                    emailAlreadyUsed,
                    details,
                    email: (() => {
                        if (signupType === SignupType.Username) {
                            if (details.username.trim()) {
                                return joinUsernameDomain(details.username, domain);
                            }
                            return '';
                        }
                        return details.email;
                    })(),
                })}
            </form>
        </>
    );
};

export default AccountStepDetails;
