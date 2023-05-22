import { KeyboardEvent, MutableRefObject, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { CircleLoader } from '@proton/atoms/CircleLoader';
import { InlineLinkButton, InputFieldTwo, PasswordInputTwo } from '@proton/components/components';
import { Challenge, ChallengeRef } from '@proton/components/containers';
import { useNotifications } from '@proton/components/hooks';
import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { TelemetryAccountSignupEvents } from '@proton/shared/lib/api/telemetry';
import { queryCheckEmailAvailability } from '@proton/shared/lib/api/user';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';
import { getOwnershipVerificationHeaders, mergeHeaders } from '@proton/shared/lib/fetch/headers';
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

import { AccountData, SignupType } from '../signup/interfaces';
import { useFlowRef } from '../useFlowRef';
import AlreadyUsedNotification from './AlreadyUsedNotification';
import { Measure, OnOpenLogin } from './interface';
import { InteractFields } from './measure';

const first = <T,>(errors: T[]) => {
    return errors.find((x) => !!x);
};

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
    validate: () => Promise<boolean>;
    data: () => Promise<AccountData>;
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

interface Props {
    accountStepDetailsRef: MutableRefObject<AccountStepDetailsRef | undefined>;
    disableChange: boolean;
    onSubmit?: () => void;
    api: Api;
    onChallengeLoaded: () => void;
    onChallengeError: () => void;
    onOpenLogin: OnOpenLogin;
    loading: boolean;
    appName?: string;
    measure: Measure;
}

const AccountStepDetails = ({
    loading,
    accountStepDetailsRef,
    disableChange,
    onSubmit,
    api,
    onChallengeLoaded,
    onChallengeError,
    onOpenLogin,
    appName,
    measure,
}: Props) => {
    const { createNotification } = useNotifications();
    const createFlow = useFlowRef();

    const challengeRefEmail = useRef<ChallengeRef>();
    const formInputRef = useRef<HTMLFormElement>(null);
    const inputValuesRef = useRef({ email: false, emailConfirm: false });

    const [details, setDetails] = useState<AccountDetails>(defaultInputs);
    const [states, setStates] = useState<AccountDetailsInputState>(defaultInputStates);

    const trimmedEmail = details.email.trim();

    const [emailAsyncError, setEmailAsyncError] = useState({ email: '', message: '' });

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

    const errorDetails: ErrorDetails = {
        email: first([
            trimmedEmail === emailAsyncError.email ? emailAsyncError.message : '',
            requiredValidator(trimmedEmail),
            emailValidator(trimmedEmail),
        ]),
        emailConfirm: first([
            requiredValidator(details.emailConfirm.trim()),
            confirmEmailValidator(trimmedEmail, details.emailConfirm.trim()),
        ]),
        password: first([requiredValidator(details.password), passwordLengthValidator(details.password)]),
        passwordConfirm: first([
            requiredValidator(details.passwordConfirm),
            confirmPasswordValidator(details.passwordConfirm, details.password),
        ]),
    };

    const scrollInto = (target: 'email' | 'emailConfirm' | 'password' | 'passwordConfirm') => {
        if (target === 'email' || target === 'emailConfirm') {
            setTimeout(() => {
                formInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 0);
            if (target === 'email') {
                challengeRefEmail.current?.focus('#email');
            }
            if (target === 'emailConfirm') {
                challengeRefEmail.current?.focus('#email-confirm');
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
        el.focus();
        setTimeout(() => {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 0);
    };

    const validateAsyncEmail = async () => {
        const email = trimmedEmail;

        const validateFlow = createFlow();

        try {
            await api(mergeHeaders(queryCheckEmailAvailability(email), getOwnershipVerificationHeaders('lax')));
            measure({
                event: TelemetryAccountSignupEvents.beAvailableExternal,
                dimensions: { availableExternal: 'true' },
            });
            return true;
        } catch (e) {
            if (!validateFlow()) {
                return false;
            }
            const { code, message } = getApiError(e);
            if (
                [
                    API_CUSTOM_ERROR_CODES.ALREADY_USED,
                    API_CUSTOM_ERROR_CODES.EMAIL_FORMAT,
                    API_CUSTOM_ERROR_CODES.NOT_ALLOWED,
                ].includes(code)
            ) {
                setEmailAsyncError({ email, message });
                createNotification({
                    type: 'error',
                    text: (
                        <AlreadyUsedNotification
                            onClick={() => {
                                onOpenLogin({ email, location: 'error_msg' });
                            }}
                        />
                    ),
                    key: 'already-used',
                    expiration: 7000,
                });
                scrollInto('email');
                measure({
                    event: TelemetryAccountSignupEvents.beAvailableExternal,
                    dimensions: { availableExternal: 'false' },
                });
            }
            return false;
        }
    };

    const validateAccountDetails = () => {
        const fields = ((): (keyof AccountDetailsInputState)[] => {
            return (
                [
                    errorDetails.email ? 'email' : undefined,
                    errorDetails.emailConfirm ? 'emailConfirm' : undefined,
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

    useImperativeHandle(accountStepDetailsRef, () => ({
        validate: async () => {
            return validateAccountDetails() && (await validateAsyncEmail());
        },
        data: async () => {
            return {
                email: trimmedEmail,
                password: details.password,
                signupType: SignupType.Email,
                payload: await challengeRefEmail.current?.getChallenge(),
                username: '',
                domain: '',
            };
        },
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

    const signIn = (
        <InlineLinkButton
            key="signin"
            className="link link-focus text-nowrap"
            onClick={() => {
                //onUpdate({ create: 'login' });
                onOpenLogin({ email: trimmedEmail, location: 'step2' });
            }}
        >
            {c('Link').t`Sign in`}
        </InlineLinkButton>
    );
    const emailError = states.email.interactive && states.email.focus ? errorDetails.email : undefined;
    const emailConfirmError =
        states.emailConfirm.interactive && states.emailConfirm.focus ? errorDetails.emailConfirm : undefined;
    const passwordError = states.password.interactive && states.password.focus ? errorDetails.password : undefined;
    const passwordConfirmError =
        states.passwordConfirm.interactive && states.passwordConfirm.focus ? errorDetails.passwordConfirm : undefined;
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
                    onSubmit?.();
                }}
            >
                <div className="flex flex-column gap-1 mb-4">
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
                        <InputFieldTwo
                            ref={emailRef}
                            id="email"
                            label={c('Signup label').t`Email address`}
                            inputClassName="email-input-field"
                            error={emailError}
                            disableChange={disableChange}
                            dense={!emailError}
                            rootClassName={!emailError ? 'pb-2' : undefined}
                            value={details.email}
                            onValue={(value: string) => {
                                inputValuesRef.current.email = true;
                                setInputsDiff({ email: value });
                                setInputsStateDiff({ email: { interactive: true } });
                            }}
                            onBlur={() => {
                                // Doesn't work because it's in the challenge
                                setInputsStateDiff({ emailConfirm: { focus: true } });
                            }}
                            onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
                                if (event.key === 'Enter') {
                                    onSubmit?.();
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
                                }}
                                onBlur={() => {
                                    // Doesn't work because it's in the challenge
                                    setInputsStateDiff({ emailConfirm: { focus: true } });
                                }}
                                onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
                                    if (event.key === 'Enter') {
                                        onSubmit?.();
                                    }
                                }}
                            />
                        )}
                    </Challenge>

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
                        onFocus={() => {
                            //handleUpdate('email', { emType: 'email' });
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
                            onFocus={() => {
                                //handleUpdate('email', { emType: 'confirm' });
                            }}
                            onBlur={() => {
                                setInputsStateDiff({ passwordConfirm: { focus: true } });
                            }}
                        />
                    )}
                </div>
                {onSubmit && (
                    <div className="mb-4">
                        <Button type="submit" size="large" loading={disableChange} color="norm" fullWidth>
                            {c('pass_signup_2023: Action').t`Start using ${appName} now`}
                        </Button>
                    </div>
                )}
                <div className="text-center">
                    <span>
                        {
                            // translator: Full sentence "Already have an account? Sign in"
                            c('Go to sign in').jt`Already have an account? ${signIn}`
                        }
                    </span>
                </div>
            </form>
        </>
    );
};

export default AccountStepDetails;
