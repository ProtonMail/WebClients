import type { KeyboardEvent } from 'react';
import { useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { Link } from 'react-router-dom';

import { c } from 'ttag';

import { Button, InlineLinkButton } from '@proton/atoms';
import type { ChallengeRef, ChallengeResult } from '@proton/components';
import {
    Challenge,
    DropdownSizeUnit,
    Info,
    InputFieldTwo,
    Option,
    PasswordInputTwo,
    SelectTwo,
    useConfig,
    useFormErrors,
} from '@proton/components';
import { useLoading } from '@proton/hooks';
import metrics from '@proton/metrics';
import type { APP_NAMES, CLIENT_TYPES } from '@proton/shared/lib/constants';
import { APPS } from '@proton/shared/lib/constants';
import { BRAND_NAME, CALENDAR_APP_NAME, MAIL_APP_NAME } from '@proton/shared/lib/constants';
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
import noop from '@proton/utils/noop';

import Content from '../public/Content';
import Header from '../public/Header';
import Main from '../public/Main';
import { getAccountDetailsFromEmail } from '../single-signup-v2/accountDetails';
import PasswordStrengthIndicatorSpotlight, {
    usePasswordStrengthIndicatorSpotlight,
} from './PasswordStrengthIndicatorSpotlight';
import challengeIconsSvg from './challenge-icons.source.svg';
import { getThemeData } from './challenge-theme';
import { getSignupApplication } from './helper';
import { SignupType } from './interfaces';
import { getTerms } from './terms';

import './AccountStep.scss';

export interface AccountStepProps {
    clientType: CLIENT_TYPES;
    onBack?: () => void;
    defaultUsername?: string;
    defaultEmail?: string;
    toApp: APP_NAMES | undefined;
    signupTypes: SignupType[];
    signupType: SignupType;
    onChangeSignupType: (signupType: SignupType) => void;
    defaultRecoveryEmail?: string;
    domains: string[];
    hasChallenge?: boolean;
    title: string;
    subTitle: string;
    onSubmit: (form: {
        username: string;
        email: string;
        password: string;
        signupType: SignupType;
        domain: string;
        payload: ChallengeResult;
    }) => Promise<void>;
    loadingDependencies?: boolean;
    loginUrl: string;
}

const resetValueForChallenge = (setValue: (value: string) => void, value: string) => {
    // If sanitisation happens, force re-render the input with a new value so that the values get removed in the iframe
    flushSync(() => {
        setValue(value + ' ');
    });
    setValue(value);
};

const AccountStep = ({
    onBack,
    title,
    toApp,
    subTitle,
    defaultEmail,
    signupTypes,
    signupType,
    onChangeSignupType,
    onSubmit,
    hasChallenge = true,
    domains,
    loadingDependencies,
    loginUrl,
}: AccountStepProps) => {
    const { APP_NAME } = useConfig();
    const challengeRefLogin = useRef<ChallengeRef>();
    const anchorRef = useRef<HTMLButtonElement | null>(null);
    const passwordContainerRef = useRef<HTMLDivElement | null>(null);
    const [loading, withLoading] = useLoading();
    const [, setRerender] = useState<any>();
    const [loadingChallenge, setLoadingChallenge] = useState(hasChallenge);
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [maybeDomain, setDomain] = useState('');
    const passwordStrengthIndicatorSpotlight = usePasswordStrengthIndicatorSpotlight();

    const trimmedEmail = email.trim();
    const trimmedUsername = username.trim();

    const domainOptions = domains.map((DomainName) => ({ text: DomainName, value: DomainName }));

    const isLoadingView = loadingDependencies;
    const disableChange = loading || loadingChallenge;

    const { validator, onFormSubmit } = useFormErrors();

    const domain = maybeDomain || domains?.[0];

    const run = async () => {
        const payload = await challengeRefLogin.current?.getChallenge().catch(noop);
        return onSubmit({
            username: trimmedUsername,
            password,
            signupType,
            domain,
            email: trimmedEmail,
            payload,
        });
    };

    const disableInitialFormSubmit = loadingDependencies || loadingChallenge;

    const handleSubmit = () => {
        if (loading || !onFormSubmit() || disableInitialFormSubmit) {
            return;
        }
        withLoading(run()).catch(noop);
    };

    useEffect(() => {
        if (!domains.length || !defaultEmail) {
            return;
        }
        const accountDetails = getAccountDetailsFromEmail({
            email: defaultEmail,
            domains,
            defaultDomain: domain,
        });
        if (accountDetails.signupType === SignupType.Proton) {
            onChangeSignupType(accountDetails.signupType);
            setUsername(accountDetails.local);
            setDomain(accountDetails.domain);
        } else if (signupTypes.includes(SignupType.External)) {
            onChangeSignupType(SignupType.External);
            setEmail(defaultEmail);
        }
    }, [defaultEmail, domains]);

    /**
     * Signup page load count metric
     */
    useEffect(() => {
        if (isLoadingView) {
            return;
        }

        void metrics.core_signup_pageLoad_total.increment({
            step: signupType === SignupType.External ? 'external_account_creation' : 'proton_account_creation',
            application: getSignupApplication(APP_NAME),
        });
    }, [isLoadingView, signupType]);

    const emailLabel = signupType === SignupType.Proton ? c('Signup label').t`Username` : c('Signup label').t`Email`;

    const innerChallenge = (
        <InputFieldTwo
            id="email"
            bigger
            label={emailLabel}
            error={validator(
                signupType === SignupType.Proton
                    ? [
                          requiredValidator(trimmedUsername),
                          usernameLengthValidator(trimmedUsername),
                          usernameStartCharacterValidator(trimmedUsername),
                          usernameEndCharacterValidator(trimmedUsername),
                          usernameCharacterValidator(trimmedUsername),
                      ]
                    : [requiredValidator(trimmedEmail), emailValidator(trimmedEmail)]
            )}
            inputClassName={hasChallenge ? 'email-input-field' : undefined}
            suffix={(() => {
                if (signupType === SignupType.External) {
                    /* Something empty to avoid a layout gap when switching */
                    return <></>;
                }
                if (domainOptions.length === 1) {
                    return (
                        <span className="text-ellipsis" title={`@${domain}`}>
                            @{domain}
                        </span>
                    );
                }
                return (
                    <SelectTwo
                        id="select-domain"
                        originalPlacement="bottom-end"
                        anchorRef={anchorRef}
                        size={{ width: DropdownSizeUnit.Static }}
                        unstyled
                        onOpen={() => setRerender({})}
                        onClose={() => setRerender({})}
                        value={domain}
                        onChange={({ value }) => setDomain(value)}
                    >
                        {domainOptions.map((option) => (
                            <Option key={option.value} value={option.value} title={option.text}>
                                @{option.text}
                            </Option>
                        ))}
                    </SelectTwo>
                );
            })()}
            value={signupType === SignupType.Proton ? username : email}
            onValue={(() => {
                if (signupType === SignupType.Proton) {
                    return (value: string) => {
                        const sanitizedValue = value.replaceAll('@', '');
                        setUsername(sanitizedValue);
                        if (sanitizedValue !== value) {
                            resetValueForChallenge(setUsername, sanitizedValue);
                        }
                    };
                }
                return setEmail;
            })()}
            onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
                if (event.key === 'Enter') {
                    // formRef.submit does not trigger handler
                    handleSubmit();
                }
            }}
            readOnly={disableChange}
            disableReadOnlyField={disableChange}
        />
    );

    const signIn = (
        <Link key="signin" className="link link-focus text-nowrap" to={loginUrl}>
            {c('Link').t`Sign in`}
        </Link>
    );

    return (
        <Main>
            <Header title={title} subTitle={subTitle} onBack={onBack} />
            <Content>
                <form
                    name="accountForm"
                    onSubmit={(e) => {
                        e.preventDefault();
                        return handleSubmit();
                    }}
                    method="post"
                    autoComplete="off"
                    noValidate
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
                    <input
                        id="username"
                        name="username"
                        className="visibility-hidden absolute"
                        type="email"
                        autoComplete="username"
                        value={(() => {
                            if (signupType === SignupType.Proton) {
                                return trimmedUsername.length ? `${trimmedUsername}@${domain}` : '';
                            }
                            return email;
                        })()}
                        readOnly
                    />
                    {hasChallenge ? (
                        <Challenge
                            getThemeData={getThemeData}
                            getIconsData={() => challengeIconsSvg}
                            bodyClassName="color-norm bg-norm px-2"
                            iframeClassName="challenge-width-increase"
                            challengeRef={challengeRefLogin}
                            type={0}
                            title={c('Signup label').t`Email address`}
                            name="username"
                            onSuccess={() => {
                                setLoadingChallenge(false);
                                challengeRefLogin.current?.focus('#email');
                            }}
                            onError={() => {
                                setLoadingChallenge(false);
                            }}
                        >
                            {innerChallenge}
                        </Challenge>
                    ) : (
                        innerChallenge
                    )}
                    {signupTypes.includes(SignupType.External) && signupTypes.length > 1 ? (
                        <div className="text-center mb-4">
                            <InlineLinkButton
                                id="existing-email-button"
                                onClick={() => {
                                    // Reset verification parameters if email is changed
                                    onChangeSignupType(
                                        (() => {
                                            if (signupType === SignupType.Proton) {
                                                return SignupType.External;
                                            }
                                            return signupTypes.find((type) => type !== signupType) || signupType;
                                        })()
                                    );
                                    setUsername('');
                                    setEmail('');
                                }}
                            >
                                {signupType === SignupType.External
                                    ? c('Action').t`Get a new encrypted email address`
                                    : c('Action').t`Use your current email instead`}
                            </InlineLinkButton>
                            <Info
                                buttonTabIndex={-1}
                                className="ml-2"
                                title={
                                    signupType === SignupType.External
                                        ? c('Info')
                                              .t`With an encrypted ${BRAND_NAME} address, you can use all ${BRAND_NAME} services`
                                        : c('Info')
                                              .t`You will need a ${BRAND_NAME} address to use ${MAIL_APP_NAME} and ${CALENDAR_APP_NAME}`
                                }
                            />
                        </div>
                    ) : null}

                    <PasswordStrengthIndicatorSpotlight
                        wrapper={passwordStrengthIndicatorSpotlight}
                        anchorRef={passwordContainerRef}
                        password={password}
                    >
                        <InputFieldTwo
                            containerRef={passwordContainerRef}
                            as={PasswordInputTwo}
                            id="password"
                            label={c('Label').t`Password`}
                            assistiveText={
                                !passwordStrengthIndicatorSpotlight.supported &&
                                passwordStrengthIndicatorSpotlight.inputFocused &&
                                getMinPasswordLengthMessage()
                            }
                            error={validator([requiredValidator(password), passwordLengthValidator(password)])}
                            bigger
                            disableChange={disableChange}
                            autoComplete="new-password"
                            value={password}
                            onValue={setPassword}
                            rootClassName="mt-2"
                            onFocus={passwordStrengthIndicatorSpotlight.onInputFocus}
                            onBlur={passwordStrengthIndicatorSpotlight.onInputBlur}
                        />
                    </PasswordStrengthIndicatorSpotlight>

                    <InputFieldTwo
                        as={PasswordInputTwo}
                        id="repeat-password"
                        label={c('Label').t`Repeat password`}
                        error={validator([
                            requiredValidator(password),
                            confirmPasswordValidator(confirmPassword, password),
                        ])}
                        bigger
                        disableChange={disableChange}
                        autoComplete="new-password"
                        value={confirmPassword}
                        onValue={setConfirmPassword}
                        rootClassName="mt-2"
                    />
                    <Button
                        {...(() => {
                            if (loading) {
                                return { loading };
                            }
                            if (disableInitialFormSubmit) {
                                return {
                                    disabled: true,
                                    // This prop is used to make disabled state not layout shift too much
                                    // It's kind of a hack
                                    noDisabledStyles: true,
                                };
                            }
                        })()}
                        size="large"
                        color="norm"
                        type="submit"
                        fullWidth
                        className="mt-6"
                    >
                        {c('Action').t`Create account`}
                    </Button>

                    <div className="text-center mt-4">
                        {
                            // translator: Full sentence "Already have an account? Sign in"
                            c('Go to sign in').jt`Already have an account? ${signIn}`
                        }
                    </div>

                    <hr className="my-4" />

                    <div className="color-weak text-center text-sm px-0 md:px-7">
                        {getTerms(toApp || APPS.PROTONACCOUNT)}
                    </div>
                </form>
            </Content>
        </Main>
    );
};

export default AccountStep;
