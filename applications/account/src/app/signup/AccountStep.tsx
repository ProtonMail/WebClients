import type { KeyboardEvent } from 'react';
import { useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { Link } from 'react-router-dom';

import { c } from 'ttag';

import { Button, InlineLinkButton } from '@proton/atoms';
import type { ChallengeRef, ChallengeResult } from '@proton/components';
import {
    Challenge,
    ChallengeError,
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
import clsx from '@proton/utils/clsx';
import noop from '@proton/utils/noop';

import Content from '../public/Content';
import Header from '../public/Header';
import Main from '../public/Main';
import { getAccountDetailsFromEmail } from '../single-signup-v2/accountDetails';
import Loader from './Loader';
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
    loading?: boolean;
    loginUrl: string;
}

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
    loading: loadingDependencies,
    loginUrl,
}: AccountStepProps) => {
    const { APP_NAME } = useConfig();
    const challengeRefLogin = useRef<ChallengeRef>();
    const anchorRef = useRef<HTMLButtonElement | null>(null);
    const [loading, withLoading] = useLoading();
    const [, setRerender] = useState<any>();
    const [challengeLoading, setChallengeLoading] = useState(hasChallenge);
    const [challengeError, setChallengeError] = useState(false);
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [maybeDomain, setDomain] = useState(domains?.[0] || ''); // This is set while domains are loading
    const [passwordInputFocused, setPasswordInputFocused] = useState(false);

    const trimmedEmail = email.trim();
    const trimmedUsername = username.trim();

    const domainOptions = domains.map((DomainName) => ({ text: DomainName, value: DomainName }));

    const isLoadingView = challengeLoading || loadingDependencies;

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

    const handleSubmit = () => {
        if (loading || !onFormSubmit()) {
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
        if (accountDetails.signupType === SignupType.Username) {
            onChangeSignupType(accountDetails.signupType);
            setUsername(accountDetails.local);
            setDomain(accountDetails.domain);
        } else if (signupTypes.includes(SignupType.Email)) {
            onChangeSignupType(SignupType.Email);
            setEmail(defaultEmail);
        }
    }, [defaultEmail, domains]);

    useEffect(() => {
        if (isLoadingView) {
            return;
        }
        // Special focus management for challenge
        setTimeout(() => {
            challengeRefLogin.current?.focus('#email');
        }, 0);
    }, [signupType, isLoadingView]);

    /**
     * Signup page load count metric
     */
    useEffect(() => {
        if (isLoadingView) {
            return;
        }

        void metrics.core_signup_pageLoad_total.increment({
            step: signupType === SignupType.Email ? 'external_account_creation' : 'proton_account_creation',
            application: getSignupApplication(APP_NAME),
        });
    }, [isLoadingView, signupType]);

    const emailLabel = signupType === SignupType.Username ? c('Signup label').t`Username` : c('Signup label').t`Email`;

    const innerChallenge = (
        <InputFieldTwo
            id="email"
            bigger
            label={emailLabel}
            error={validator(
                signupType === SignupType.Username
                    ? [
                          requiredValidator(trimmedUsername),
                          usernameLengthValidator(trimmedUsername),
                          usernameStartCharacterValidator(trimmedUsername),
                          usernameEndCharacterValidator(trimmedUsername),
                          usernameCharacterValidator(trimmedUsername),
                      ]
                    : [requiredValidator(trimmedEmail), emailValidator(trimmedEmail)]
            )}
            disableChange={loading}
            autoFocus
            inputClassName={hasChallenge ? 'email-input-field' : undefined}
            suffix={(() => {
                if (signupType === SignupType.Email) {
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
            value={signupType === SignupType.Username ? username : email}
            onValue={(() => {
                if (signupType === SignupType.Username) {
                    return (value: string) => {
                        const sanitizedValue = value.replaceAll('@', '');
                        setUsername(sanitizedValue);
                        // If sanitisation happens, force re-render the input with a new value so that the values get removed in the iframe
                        if (sanitizedValue !== value) {
                            flushSync(() => {
                                setUsername(sanitizedValue + ' ');
                            });
                            setUsername(sanitizedValue);
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
        />
    );

    if (challengeError) {
        return <ChallengeError />;
    }

    const signIn = (
        <Link key="signin" className="link link-focus text-nowrap" to={loginUrl}>
            {c('Link').t`Sign in`}
        </Link>
    );

    return (
        <Main>
            <Header
                title={title}
                subTitle={
                    isLoadingView ? (
                        /**
                         * Take up required space whilst loading
                         * and prevent a layout shift in most cases.
                         */
                        <>&#x200b;</>
                    ) : (
                        subTitle
                    )
                }
                onBack={onBack}
            />
            <Content>
                {isLoadingView && (
                    <div className="text-center absolute inset-center">
                        <Loader />
                    </div>
                )}
                <form
                    name="accountForm"
                    className={isLoadingView ? 'visibility-hidden' : undefined}
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
                            if (signupType === SignupType.Username) {
                                return trimmedUsername.length ? `${trimmedUsername}@${domain}` : '';
                            }
                            return email;
                        })()}
                        readOnly
                    />
                    {hasChallenge ? (
                        <Challenge
                            bodyClassName="color-norm bg-norm px-2"
                            iframeClassName="challenge-width-increase"
                            challengeRef={challengeRefLogin}
                            type={0}
                            title={emailLabel}
                            name="username"
                            onSuccess={() => {
                                setChallengeLoading(false);
                            }}
                            onError={() => {
                                setChallengeLoading(false);
                                setChallengeError(true);
                            }}
                        >
                            {innerChallenge}
                        </Challenge>
                    ) : (
                        innerChallenge
                    )}
                    {signupTypes.includes(SignupType.Email) && signupTypes.length > 1 ? (
                        <div className={clsx('text-center mb-4', isLoadingView && 'hidden')}>
                            <InlineLinkButton
                                id="existing-email-button"
                                onClick={() => {
                                    // Reset verification parameters if email is changed
                                    onChangeSignupType(
                                        (() => {
                                            if (signupType === SignupType.Username) {
                                                return SignupType.Email;
                                            }
                                            return signupTypes.find((type) => type !== signupType) || signupType;
                                        })()
                                    );
                                    setUsername('');
                                    setEmail('');
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

                    <InputFieldTwo
                        as={PasswordInputTwo}
                        id="password"
                        label={c('Label').t`Password`}
                        assistiveText={passwordInputFocused && getMinPasswordLengthMessage()}
                        error={validator([requiredValidator(password), passwordLengthValidator(password)])}
                        bigger
                        disableChange={loading}
                        autoComplete="new-password"
                        value={password}
                        onValue={setPassword}
                        rootClassName="mt-2"
                        onFocus={() => setPasswordInputFocused(true)}
                        onBlur={() => setPasswordInputFocused(false)}
                    />

                    <InputFieldTwo
                        as={PasswordInputTwo}
                        id="repeat-password"
                        label={c('Label').t`Repeat password`}
                        error={validator([
                            requiredValidator(password),
                            passwordLengthValidator(confirmPassword),
                            confirmPasswordValidator(confirmPassword, password),
                        ])}
                        bigger
                        disableChange={loading}
                        autoComplete="new-password"
                        value={confirmPassword}
                        onValue={setConfirmPassword}
                        rootClassName="mt-2"
                    />
                    <Button size="large" color="norm" type="submit" fullWidth loading={loading} className="mt-6">
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
