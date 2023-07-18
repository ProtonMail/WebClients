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

import { c } from 'ttag';

import { CircleLoader } from '@proton/atoms/CircleLoader';
import { Icon, InputFieldTwo, PasswordInputTwo } from '@proton/components/components';
import { Challenge, ChallengeRef } from '@proton/components/containers';
import { TelemetryAccountSignupEvents } from '@proton/shared/lib/api/telemetry';
import { PLANS } from '@proton/shared/lib/constants';
import {
    confirmEmailValidator,
    confirmPasswordValidator,
    emailValidator,
    getMinPasswordLengthMessage,
    passwordLengthValidator,
    requiredValidator,
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
    EmailAsyncState,
    EmailValidationState,
    createAsyncValidator,
    defaultEmailValidationState,
} from './validateEmail';

import '../signup/AccountStep.scss';

const first = <T,>(errors: T[]) => {
    return errors.find((x) => !!x);
};

const validator = createAsyncValidator();

interface InputState {
    interactive: boolean;
    focus: boolean;
}

interface AccountDetailsInputState {
    email: Partial<InputState>;
    emailConfirm: Partial<InputState>;
    password: Partial<InputState>;
    passwordConfirm: Partial<InputState>;
}

interface AccountDetails {
    email: string;
    emailConfirm: string;
    password: string;
    passwordConfirm: string;
}

export interface ErrorDetails {
    email: string | undefined;
    emailConfirm: string | undefined;
    password: string | undefined;
    passwordConfirm: string | undefined;
}

const defaultInputs = {
    email: '',
    emailConfirm: '',
    password: '',
    passwordConfirm: '',
};

const defaultInputStates = {
    email: {},
    emailConfirm: {},
    password: {},
    passwordConfirm: {},
};

export interface AccountStepDetailsRef {
    validate: () => boolean;
    data: () => Promise<AccountData>;
    scrollInto: (target: 'email' | 'emailConfirm' | 'password' | 'passwordConfirm') => void;
}

const getMeasurement = (diff: Partial<AccountDetailsInputState>) => {
    return Object.entries(diff)
        .map(([_key, value]) => {
            const key = _key as keyof typeof diff;
            const field: InteractFields | undefined = (() => {
                if (key === 'email') {
                    return 'email';
                }
                if (key === 'emailConfirm') {
                    return 'email_confirm';
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

const getErrorDetails = ({
    emailValidationState,
    email = '',
    emailConfirm = '',
    password = '',
    passwordConfirm = '',
}: {
    emailValidationState?: EmailValidationState;
    email?: string;
    emailConfirm?: string;
    password?: string;
    passwordConfirm?: string;
}): ErrorDetails => {
    const trimmedEmail = email.trim();
    const trimmedEmailConfirm = emailConfirm.trim();
    return {
        email: first([
            trimmedEmail === emailValidationState?.email ? emailValidationState?.message : '',
            requiredValidator(trimmedEmail),
            emailValidator(trimmedEmail),
        ]),
        emailConfirm: first([
            requiredValidator(trimmedEmailConfirm),
            confirmEmailValidator(trimmedEmail, trimmedEmailConfirm),
        ]),
        password: first([requiredValidator(password), passwordLengthValidator(password)]),
        passwordConfirm: first([
            requiredValidator(passwordConfirm),
            confirmPasswordValidator(passwordConfirm, password),
        ]),
    };
};

interface Props {
    accountStepDetailsRef: MutableRefObject<AccountStepDetailsRef | undefined>;
    disableChange: boolean;
    onSubmit?: () => void;
    api: Api;
    model: SignupModelV2;
    onChallengeLoaded: () => void;
    onChallengeError: () => void;
    loading: boolean;
    measure: BaseMeasure<InteractCreateEvents | UserCheckoutEvents | AvailableExternalEvents>;
    passwordFields: boolean;
    footer: (details: AccountDetails) => ReactNode;
}

const AccountStepDetails = ({
    loading,
    accountStepDetailsRef,
    disableChange,
    footer,
    api,
    model,
    onSubmit,
    onChallengeLoaded,
    onChallengeError,
    measure,
    passwordFields,
}: Props) => {
    const challengeRefEmail = useRef<ChallengeRef>();
    const formInputRef = useRef<HTMLFormElement>(null);
    const inputValuesRef = useRef({ email: false, emailConfirm: false });

    const [details, setDetails] = useState<AccountDetails>(defaultInputs);
    const [states, setStates] = useState<AccountDetailsInputState>(defaultInputStates);

    const trimmedEmail = details.email.trim();

    const [emailValidationState, setEmailValidationState] = useState<EmailValidationState>(defaultEmailValidationState);

    const emailRef = useRef<HTMLInputElement>(null);
    const emailConfirmRef = useRef<HTMLInputElement>(null);
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

    const scrollInto = (target: 'email' | 'emailConfirm' | 'password' | 'passwordConfirm') => {
        if (target === 'email' || target === 'emailConfirm') {
            formInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });

            const focusChallenge = (id: string) => {
                // This is a hack prevent scroll since we'd need to add support for that in challenge
                // TODO: Add support for preventScroll
                const scrollEl = document.body.querySelector('.scroll-if-needed');
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
            if (target === 'emailConfirm') {
                focusChallenge('#email-confirm');
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
        emailValidationState,
        email: trimmedEmail,
        emailConfirm: details.emailConfirm,
        password: details.password,
        passwordConfirm: details.passwordConfirm,
    });

    const validateAccountDetails = () => {
        const fields = ((): (keyof AccountDetailsInputState)[] => {
            const hasValidAsyncEmailState =
                emailValidationState.email === trimmedEmail && emailValidationState.state === EmailAsyncState.Success;

            return (
                [
                    !hasValidAsyncEmailState ? 'email' : undefined,
                    errorDetails.email ? 'email' : undefined,
                    errorDetails.emailConfirm ? 'emailConfirm' : undefined,
                    passwordFields && errorDetails.password ? 'password' : undefined,
                    passwordFields && errorDetails.passwordConfirm ? 'passwordConfirm' : undefined,
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

    useImperativeHandle(accountStepDetailsRef, () => ({
        validate: () => {
            return validateAccountDetails();
        },
        data: async () => {
            return {
                email: trimmedEmail,
                password: details.password,
                signupType: SignupType.Email,
                payload: await challengeRefEmail.current?.getChallenge().catch(noop),
                username: '',
                domain: '',
            };
        },
        scrollInto,
    }));

    useEffect(() => {
        const handleFocus = () => {
            // This a hack to get the email input state to be true since onBlur event isn't triggered.
            // Basically any time something else gets focus on the page and the email input has gotten values.
            const keys = ['email', 'emailConfirm'] as const;
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

    const emailError = states.email.interactive && states.email.focus ? errorDetails.email : undefined;
    const emailConfirmError =
        states.emailConfirm.interactive && states.emailConfirm.focus ? errorDetails.emailConfirm : undefined;
    const passwordError = states.password.interactive && states.password.focus ? errorDetails.password : undefined;
    const passwordConfirmError =
        states.passwordConfirm.interactive && states.passwordConfirm.focus ? errorDetails.passwordConfirm : undefined;
    const inputsWrapper = 'flex flex-column gap-1';
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
                                    if (emailValidationState.state === EmailAsyncState.Success) {
                                        return (
                                            <Icon
                                                name="checkmark-circle"
                                                className="color-success"
                                                size={16}
                                                data-testid="email-valid"
                                            />
                                        );
                                    }
                                    if (emailValidationState.state === EmailAsyncState.Loading) {
                                        return <CircleLoader size="small" />;
                                    }
                                })()}
                                disableChange={disableChange}
                                dense={!emailError}
                                rootClassName={!emailError ? 'pb-2' : undefined}
                                value={details.email}
                                onValue={(value: string) => {
                                    inputValuesRef.current.email = true;
                                    setInputsDiff({ email: value });
                                    setInputsStateDiff({ email: { interactive: true } });
                                    const email = value.trim();
                                    const errors = getErrorDetails({
                                        email,
                                        emailConfirm: details.emailConfirm.trim(),
                                    });
                                    validator.trigger({
                                        api,
                                        error: !!(errors.email || errors.emailConfirm),
                                        email,
                                        set: setEmailValidationState,
                                        measure,
                                    });
                                }}
                                onBlur={() => {
                                    // Doesn't work because it's in the challenge
                                    setInputsStateDiff({ email: { focus: true } });
                                }}
                                onClick={() => {
                                    if (inputValuesRef.current.emailConfirm) {
                                        setInputsStateDiff({ emailConfirm: { focus: true } });
                                    }
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

                            {states.email.interactive && (
                                <InputFieldTwo
                                    ref={emailConfirmRef}
                                    id="email-confirm"
                                    placeholder={c('Signup label').t`Confirm email address`}
                                    inputClassName="email-input-field"
                                    error={emailConfirmError}
                                    dense={!emailConfirmError}
                                    rootClassName={clsx(!emailConfirmError && 'pb-2', emailError && 'pt-2')}
                                    disableChange={disableChange}
                                    value={details.emailConfirm}
                                    onValue={(value: string) => {
                                        inputValuesRef.current.emailConfirm = true;
                                        setInputsDiff({ emailConfirm: value });
                                        setInputsStateDiff({ emailConfirm: { interactive: true } });
                                        const email = details.email.trim();
                                        const errors = getErrorDetails({
                                            email,
                                            emailConfirm: value.trim(),
                                        });
                                        validator.trigger({
                                            api,
                                            error: !!(errors.email || errors.emailConfirm),
                                            email,
                                            set: setEmailValidationState,
                                            measure,
                                        });
                                    }}
                                    onBlur={() => {
                                        // Doesn't work because it's in the challenge
                                        setInputsStateDiff({ emailConfirm: { focus: true } });
                                    }}
                                    onClick={() => {
                                        if (inputValuesRef.current.email) {
                                            setInputsStateDiff({ email: { focus: true } });
                                        }
                                    }}
                                    onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
                                        if (event.key === 'Enter') {
                                            onSubmit?.();
                                        }
                                        if (event.key === 'Tab') {
                                            setInputsStateDiff({ emailConfirm: { focus: true } });
                                        }
                                    }}
                                />
                            )}
                        </div>
                    </Challenge>

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
                                rootClassName={clsx('mt-4', !passwordError && 'pb-2')}
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
                {footer(details)}
            </form>
        </>
    );
};

export default AccountStepDetails;
