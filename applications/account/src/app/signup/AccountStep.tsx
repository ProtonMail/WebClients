import { Fragment, KeyboardEvent, useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { Link } from 'react-router-dom';

import { c } from 'ttag';

import {
    AlertModal,
    Button,
    ButtonLike,
    Challenge,
    ChallengeError,
    ChallengeRef,
    ChallengeResult,
    Href,
    InputFieldTwo,
    ModalProps,
    Option,
    PasswordInputTwo,
    SelectTwo,
    UnderlineButton,
    useFormErrors,
    useLoading,
    useModalState,
} from '@proton/components';
import { APPS, BRAND_NAME, CLIENT_TYPES, MAIL_APP_NAME, SSO_PATHS } from '@proton/shared/lib/constants';
import {
    confirmPasswordValidator,
    emailValidator,
    getMinPasswordLengthMessage,
    passwordLengthValidator,
    requiredValidator,
} from '@proton/shared/lib/helpers/formValidators';
import { hasProtonDomain } from '@proton/shared/lib/helpers/string';
import { getTermsURL } from '@proton/shared/lib/helpers/url';
import noop from '@proton/utils/noop';

import Content from '../public/Content';
import Header from '../public/Header';
import Main from '../public/Main';
import InsecureEmailInfo from './InsecureEmailInfo';
import Loader from './Loader';
import { SignupType } from './interfaces';

import './AccountStep.scss';

const SignInPromptModal = ({ email, ...rest }: ModalProps & { email: string }) => {
    return (
        <AlertModal
            title={c('Title').t`You already have a Proton account`}
            buttons={[
                <ButtonLike as={Link} color="norm" shape="solid" to="/login">{c('Action')
                    .t`Go to sign in`}</ButtonLike>,
                <Button shape="outline" color="weak" onClick={rest.onClose}>{c('Action').t`Cancel`}</Button>,
            ]}
            {...rest}
        >
            {c('Info')
                .t`Your existing ${BRAND_NAME} account can be used to access all ${BRAND_NAME} services. Please sign in with ${email}.`}
        </AlertModal>
    );
};

interface Props {
    clientType: CLIENT_TYPES;
    onBack?: () => void;
    defaultUsername?: string;
    defaultEmail?: string;
    defaultSignupType?: SignupType;
    defaultRecoveryEmail?: string;
    hasExternalSignup?: boolean;
    domains: string[];
    hasChallenge?: boolean;
    title: string;
    subTitle: string;
    onSubmit: (form: {
        username: string;
        email: string;
        recoveryEmail: string;
        password: string;
        signupType: SignupType;
        domain: string;
        payload: ChallengeResult;
    }) => Promise<void>;
    loading?: boolean;
}

const AccountStep = ({
    clientType,
    onBack,
    title,
    subTitle,
    defaultUsername,
    defaultEmail,
    defaultSignupType: maybeDefaultSignupType,
    defaultRecoveryEmail,
    onSubmit,
    hasExternalSignup,
    hasChallenge = true,
    domains,
    loading: loadingDependencies,
}: Props) => {
    const challengeRefLogin = useRef<ChallengeRef>();
    const anchorRef = useRef<HTMLButtonElement | null>(null);
    const [loading, withLoading] = useLoading();
    const [, setRerender] = useState<any>();
    const [challengeLoading, setChallengeLoading] = useState(hasChallenge);
    const [challengeError, setChallengeError] = useState(false);
    const [username, setUsername] = useState(defaultUsername || '');
    const [email, setEmail] = useState(defaultEmail || '');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [recoveryEmail, setRecoveryEmail] = useState(defaultRecoveryEmail || '');
    const [maybeDomain, setDomain] = useState(domains?.[0] || ''); // This is set while domains are loading
    const defaultSignupType = maybeDefaultSignupType || SignupType.Username;
    const [signupType, setSignupType] = useState<SignupType>(defaultSignupType || defaultSignupType);
    const [loginModal, setLoginModal, renderLoginModal] = useModalState();

    const trimmedUsername = username.trim();

    const domainOptions = domains.map((DomainName) => ({ text: DomainName, value: DomainName }));

    const isLoadingView = challengeLoading || loadingDependencies;

    const { validator, onFormSubmit } = useFormErrors();

    const domain = maybeDomain || domains?.[0];

    const run = async () => {
        const payload = await challengeRefLogin.current?.getChallenge();
        return onSubmit({ username: trimmedUsername, password, signupType, domain, email, recoveryEmail, payload });
    };

    const handleSubmit = () => {
        if (loading || !onFormSubmit()) {
            return;
        }
        if (signupType === SignupType.VPN && hasProtonDomain(recoveryEmail)) {
            setLoginModal(true);
            return;
        }
        withLoading(run()).catch(noop);
    };

    useEffect(() => {
        if (isLoadingView) {
            return;
        }
        // Special focus management for challenge
        setTimeout(() => {
            challengeRefLogin.current?.focus('#email');
        }, 0);
    }, [signupType, isLoadingView]);

    const innerChallenge = (
        <InputFieldTwo
            id="email"
            bigger
            label={
                signupType === SignupType.Username || signupType === SignupType.VPN
                    ? c('Signup label').t`Username`
                    : c('Signup label').t`Email`
            }
            error={validator(
                signupType === SignupType.Username || signupType === SignupType.VPN
                    ? [requiredValidator(username)]
                    : [requiredValidator(email), emailValidator(email)]
            )}
            disableChange={loading}
            autoFocus
            suffix={(() => {
                if (signupType === SignupType.Email || signupType === SignupType.VPN) {
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
                        anchorRef={anchorRef}
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
            value={signupType === SignupType.Username || signupType === SignupType.VPN ? username : email}
            onValue={(() => {
                if (signupType === SignupType.Username || signupType === SignupType.VPN) {
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

    const terms = (
        <Fragment key="terms">
            <br />
            <Href url={getTermsURL(clientType === CLIENT_TYPES.VPN ? APPS.PROTONVPN_SETTINGS : undefined)}>{
                // translator: Full sentence "By creating a Proton account, you agree to our terms and conditions"
                c('new_plans: signup').t`terms and conditions`
            }</Href>
        </Fragment>
    );

    return (
        <Main>
            {renderLoginModal && <SignInPromptModal email={recoveryEmail} {...loginModal} />}
            <Header title={title} subTitle={subTitle} onBack={onBack} />
            <Content>
                {isLoadingView && (
                    <div className="text-center absolute absolute-center">
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
                                '--right-custom': '40px',
                                '--top-custom': '50px', // Magic values where the select will be
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
                            if (signupType === SignupType.VPN) {
                                return trimmedUsername;
                            }
                            if (signupType === SignupType.Username) {
                                return trimmedUsername.length ? `${trimmedUsername}@${domain}` : '';
                            }
                            return email;
                        })()}
                        readOnly
                    />
                    {hasChallenge ? (
                        <Challenge
                            noLoader
                            bodyClassName="pl0-5 pr0-5"
                            iframeClassName="challenge-width-increase"
                            challengeRef={challengeRefLogin}
                            type={0}
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
                    {signupType === SignupType.Email && <InsecureEmailInfo email={email} />}
                    {hasExternalSignup ? (
                        <div className="text-center">
                            <UnderlineButton
                                id="existing-email-button"
                                onClick={() => {
                                    // Reset verification parameters if email is changed
                                    setSignupType(
                                        (() => {
                                            if (signupType === SignupType.Username || signupType === SignupType.VPN) {
                                                return SignupType.Email;
                                            }
                                            return defaultSignupType;
                                        })()
                                    );
                                    setUsername('');
                                    setEmail('');
                                }}
                            >
                                {signupType === SignupType.Email
                                    ? c('Action').t`Create a secure ${MAIL_APP_NAME} address instead`
                                    : c('Action').t`Use your current email address instead`}
                            </UnderlineButton>
                        </div>
                    ) : null}
                    <InputFieldTwo
                        as={PasswordInputTwo}
                        id="password"
                        label={c('Label').t`Password`}
                        assistiveText={getMinPasswordLengthMessage()}
                        error={validator([requiredValidator(password), passwordLengthValidator(password)])}
                        bigger
                        disableChange={loading}
                        autoComplete="new-password"
                        value={password}
                        onValue={setPassword}
                        rootClassName="mt0-5"
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
                        rootClassName="mt0-5"
                    />
                    {signupType === SignupType.VPN && (
                        <InputFieldTwo
                            id="recovery-email"
                            label={c('Label').t`Email address`}
                            error={validator([requiredValidator(recoveryEmail), emailValidator(recoveryEmail)])}
                            bigger
                            disableChange={loading}
                            value={recoveryEmail}
                            onValue={setRecoveryEmail}
                            rootClassName="mt0-5"
                        />
                    )}
                    <Button size="large" color="norm" type="submit" fullWidth loading={loading} className="mt1-75">
                        {c('Action').t`Create account`}
                    </Button>

                    <ButtonLike
                        className="mt1"
                        fullWidth
                        color="norm"
                        shape="outline"
                        size="large"
                        as={Link}
                        to={SSO_PATHS.LOGIN}
                    >
                        {c('Link').t`Sign in`}
                    </ButtonLike>

                    <div className="color-weak text-center text-sm mt1 pl2 pr2">
                        {
                            // translator: Full sentence "By creating a Proton account, you agree to our terms and conditions"
                            c('new_plans: signup').jt`By creating a ${BRAND_NAME} account, you agree to our ${terms}`
                        }
                    </div>
                </form>
            </Content>
        </Main>
    );
};

export default AccountStep;
