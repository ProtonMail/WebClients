import {
    KeyboardEvent,
    MutableRefObject,
    ReactNode,
    useCallback,
    useEffect,
    useImperativeHandle,
    useRef,
    useState,
} from 'react';
import { flushSync } from 'react-dom';

import { c } from 'ttag';

import { CircleLoader } from '@proton/atoms/CircleLoader';
import {
    DropdownSizeUnit,
    Icon,
    Info,
    InlineLinkButton,
    InputFieldTwo,
    PasswordInputTwo,
} from '@proton/components/components';
import Option from '@proton/components/components/option/Option';
import SelectTwo from '@proton/components/components/selectTwo/SelectTwo';
import Tooltip from '@proton/components/components/tooltip/Tooltip';
import { Challenge, ChallengeRef } from '@proton/components/containers';
import { TelemetryAccountSignupEvents } from '@proton/shared/lib/api/telemetry';
import { BRAND_NAME, CALENDAR_APP_NAME, MAIL_APP_NAME, PLANS } from '@proton/shared/lib/constants';
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
import { Api } from '@proton/shared/lib/interfaces';
import clsx from '@proton/utils/clsx';
import isTruthy from '@proton/utils/isTruthy';
import noop from '@proton/utils/noop';

import { AccountData, SignupType } from '../signup/interfaces';
import { runAfterScroll } from './helper';
import type { BaseMeasure, SignupModelV2 } from './interface';
import type { AvailableExternalEvents, InteractCreateEvents, InteractFields, UserCheckoutEvents } from './measure';
import {
    AsyncValidationState,
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

const emailAsyncValidator = createAsyncValidator(validateEmailAvailability);
const usernameAsyncValidator = createAsyncValidator(validateUsernameAvailability);

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

const getErrorDetails = ({
    signupType,
    passwords,
    emailValidationState,
    usernameValidationState,
    domain = '',
    username = '',
    email = '',
    password = '',
    passwordConfirm = '',
}: {
    signupType: SignupType;
    emailValidationState?: AsyncValidationState;
    usernameValidationState?: AsyncValidationState;
    domain?: string;
    username?: string;
    email?: string;
    passwords?: boolean;
    password?: string;
    passwordConfirm?: string;
}): ErrorDetails => {
    const trimmedUsername = username.trim();
    const trimmedEmail = email.trim();
    return {
        username:
            signupType === SignupType.Username
                ? first([
                      joinUsernameDomain(trimmedUsername, domain) === usernameValidationState?.value
                          ? usernameValidationState?.message
                          : '',
                      requiredValidator(trimmedUsername),
                      usernameLengthValidator(trimmedUsername),
                      usernameStartCharacterValidator(trimmedUsername),
                      usernameEndCharacterValidator(trimmedUsername),
                      usernameCharacterValidator(trimmedUsername),
                  ])
                : undefined,
        email:
            signupType === SignupType.Email
                ? first([
                      trimmedEmail === emailValidationState?.value ? emailValidationState?.message : '',
                      requiredValidator(trimmedEmail),
                      emailValidator(trimmedEmail),
                  ])
                : undefined,
        password: passwords ? first([requiredValidator(password), passwordLengthValidator(password)]) : undefined,
        passwordConfirm: passwords
            ? first([requiredValidator(passwordConfirm), confirmPasswordValidator(passwordConfirm, password)])
            : undefined,
    };
};

interface Props {
    accountStepDetailsRef: MutableRefObject<AccountStepDetailsRef | undefined>;
    disableChange: boolean;
    disableEmail?: boolean;
    onSubmit?: () => void;
    api: Api;
    model: SignupModelV2;
    onChallengeLoaded: () => void;
    onChallengeError: () => void;
    loading: boolean;
    measure: BaseMeasure<InteractCreateEvents | UserCheckoutEvents | AvailableExternalEvents>;
    passwordFields: boolean;
    footer: ({ details, email }: { details: AccountDetails; email: string }) => ReactNode;
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
    disableEmail,
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

    const domain = maybeDomain || domains?.[0];

    const [details, setDetails] = useState<AccountDetails>(getDefaultInputs({ defaultEmail }));
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

    const scrollInto = (target: 'username' | 'email' | 'password' | 'passwordConfirm') => {
        if (target === 'email' || target === 'username') {
            formInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });

            const focusChallenge = (id: string) => {
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

    const errorDetails = getErrorDetails({
        signupType,
        username: trimmedUsername,
        domain,
        emailValidationState: emailAsyncValidationState,
        usernameValidationState: usernameAsyncValidationState,
        email: trimmedEmail,
        passwords: passwordFields,
        password: details.password,
        passwordConfirm: details.passwordConfirm,
    });

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

    const onEmailValue = (value: string) => {
        inputValuesRef.current.email = true;
        setInputsDiff({ email: value });
        setInputsStateDiff({ email: { interactive: true } });
        const email = value.trim();
        const errors = getErrorDetails({
            signupType,
            email,
        });
        emailAsyncValidator.trigger({
            api,
            error: !!errors.email,
            value: email,
            set: setEmailAsyncValidationState,
            measure,
        });
    };

    useImperativeHandle(accountStepDetailsRef, () => ({
        validate: () => {
            return validateAccountDetails();
        },
        data: async (): Promise<AccountData> => {
            return {
                username: trimmedUsername,
                email: trimmedEmail,
                password: details.password,
                signupType,
                payload: await challengeRefEmail.current?.getChallenge().catch(noop),
                domain,
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
        if (disableEmail && defaultEmail) {
            onEmailValue(defaultEmail);
        }
    }, [disableEmail, defaultEmail]);

    const usernameError = states.username.interactive && states.username.focus ? errorDetails.username : undefined;
    const emailError = states.email.interactive && states.email.focus ? errorDetails.email : undefined;
    const passwordError = states.password.interactive && states.password.focus ? errorDetails.password : undefined;
    const passwordConfirmError =
        states.passwordConfirm.interactive && states.passwordConfirm.focus ? errorDetails.passwordConfirm : undefined;
    const inputsWrapper = 'flex flex-column';
    const hasSwitchSignupType = signupTypes.includes(SignupType.Email) && signupTypes.length > 1;
    return (
        <>
            {loading && (
                <div className="text-center absolute absolute-center">
                    <CircleLoader size="medium" />
                </div>
            )}
            <form
                className={loading ? 'visibility-hidden' : undefined}
                ref={formInputRef}
                name="account-form"
                onSubmit={async (event) => {
                    event.preventDefault();
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
                        <div className={inputsWrapper}>
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
                                                    size={16}
                                                    data-testid="email-valid"
                                                />
                                            );
                                        }
                                        if (emailAsyncValidationState.state === AsyncValidationStateValue.Loading) {
                                            return <CircleLoader size="small" />;
                                        }
                                    })()}
                                    disableChange={disableChange}
                                    disabled={disableEmail}
                                    dense={!passwordFields ? !emailError : undefined}
                                    rootClassName={!passwordFields ? (!emailError ? 'pb-2' : undefined) : undefined}
                                    value={details.email}
                                    onValue={onEmailValue}
                                    onBlur={() => {
                                        // Doesn't work because it's in the challenge
                                        setInputsStateDiff({ email: { focus: true } });
                                    }}
                                    onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
                                        if (event.key === 'Enter') {
                                            onSubmit?.();
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
                                                [
                                                    AsyncValidationStateValue.Error,
                                                    AsyncValidationStateValue.Fatal,
                                                ].includes(usernameAsyncValidationState.state) ||
                                                usernameError
                                            ) {
                                                return wrap(
                                                    <Tooltip
                                                        /* Unfortunately doesn't work because it's in the challenge*/
                                                        title={usernameAsyncValidationState.message || usernameError}
                                                    >
                                                        <Icon
                                                            name="exclamation-circle-filled"
                                                            className="color-danger"
                                                            size={16}
                                                            data-testid="email-invalid"
                                                        />
                                                    </Tooltip>
                                                );
                                            }
                                            if (
                                                usernameAsyncValidationState.state === AsyncValidationStateValue.Success
                                            ) {
                                                return wrap(
                                                    <Icon
                                                        name="checkmark-circle"
                                                        className="color-success"
                                                        size={16}
                                                        data-testid="email-valid"
                                                    />
                                                );
                                            }
                                            if (
                                                usernameAsyncValidationState.state === AsyncValidationStateValue.Loading
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
                                                        setDomain(value);

                                                        usernameAsyncValidator.trigger({
                                                            api,
                                                            error: !!errorDetails.username,
                                                            value: joinUsernameDomain(trimmedUsername, value),
                                                            set: setUsernameAsyncValidationState,
                                                            measure,
                                                        });
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
                                    dense={!passwordFields ? !emailError : undefined}
                                    rootClassName={!passwordFields ? (!emailError ? 'pb-2' : undefined) : undefined}
                                    value={details.username}
                                    onValue={(value: string) => {
                                        const sanitizedValue = value.replaceAll('@', '');

                                        inputValuesRef.current.username = true;
                                        setInputsStateDiff({ username: { interactive: true } });
                                        setInputsDiff({ username: sanitizedValue });

                                        // If sanitisation happens, force re-render the input with a new value so that the values get removed in the iframe
                                        if (sanitizedValue !== value) {
                                            flushSync(() => {
                                                setInputsDiff({ username: `${value} ` });
                                            });
                                            setInputsDiff({ username: sanitizedValue });
                                        }

                                        const username = sanitizedValue.trim();
                                        const errors = getErrorDetails({
                                            signupType,
                                            username,
                                            domain,
                                        });
                                        usernameAsyncValidator.trigger({
                                            api,
                                            error: !!errors.username,
                                            value: joinUsernameDomain(username, domain),
                                            set: setUsernameAsyncValidationState,
                                            measure,
                                        });
                                    }}
                                    onBlur={() => {
                                        // Doesn't work because it's in the challenge
                                        setInputsStateDiff({ username: { focus: true } });
                                    }}
                                    onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
                                        if (event.key === 'Enter') {
                                            onSubmit?.();
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
