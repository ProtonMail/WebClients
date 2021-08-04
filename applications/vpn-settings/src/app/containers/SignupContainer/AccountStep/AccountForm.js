import { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
    classnames,
    FullLoader,
    Field,
    useApi,
    Row,
    Label,
    Href,
    useLoading,
    Info,
    Challenge,
    ChallengeError,
    captureChallengeMessage,
    Button,
    PasswordInputTwo,
    InputFieldTwo,
    useFormErrors,
} from '@proton/components';
import { c } from 'ttag';
import { queryCheckUsernameAvailability } from '@proton/shared/lib/api/user';
import {
    passwordLengthValidator,
    confirmPasswordValidator,
    getMinPasswordLengthMessage,
    requiredValidator,
    emailValidator,
} from '@proton/shared/lib/helpers/formValidators';
import isTruthy from '@proton/shared/lib/helpers/isTruthy';

const AccountForm = ({ model, onSubmit }) => {
    const [challengeLoading, setChallengeLoading] = useState(true);
    const countChallengeRef = useRef(0);
    const challengeRefUsername = useRef();
    const challengeRefEmail = useRef();
    const api = useApi();
    const [username, setUsername] = useState(model.username);
    const [password, setPassword] = useState(model.password);
    const [confirmPassword, setConfirmPassword] = useState(model.password);
    const [email, setEmail] = useState(model.email);
    const [asyncUsernameError, setAsyncUsernameError] = useState();
    const [loading, withLoading] = useLoading();
    const { validator, onFormSubmit } = useFormErrors();

    const handleChangeUsername = ({ target }) => {
        if (asyncUsernameError) {
            setAsyncUsernameError('');
        }
        setUsername(target.value);
    };

    const handleSubmit = async () => {
        try {
            await api(queryCheckUsernameAvailability(username));
            const [usernamePayload, emailPayload] = await Promise.all([
                challengeRefUsername.current?.getChallenge(),
                challengeRefEmail.current?.getChallenge(),
            ]);
            const payload =
                usernamePayload && emailPayload
                    ? {
                          ...usernamePayload,
                          ...emailPayload,
                      }
                    : {};
            await onSubmit({
                username,
                password,
                email,
                payload,
            });
        } catch (e) {
            setAsyncUsernameError(e.data ? e.data.Error : c('Error').t`Can't check username, try again later`);
        }
    };

    const termsOfServiceLink = (
        <Href key="terms" url="https://protonvpn.com/terms-and-conditions">{c('Link').t`Terms of Service`}</Href>
    );

    const privacyPolicyLink = (
        <Href key="privacy" url="https://protonvpn.com/privacy-policy">{c('Link').t`Privacy Policy`}</Href>
    );

    const errorRef = useRef(false);
    const challengeLogRef = useRef([]);

    const incrementChallengeCounters = () => {
        countChallengeRef.current++;

        if (countChallengeRef.current === 2) {
            setChallengeLoading(false);
            captureChallengeMessage(
                errorRef.current
                    ? 'Failed to load create account form fatally'
                    : 'Failed to load create account form partially',
                challengeLogRef.current
            );
        }
    };

    useEffect(() => {
        if (!challengeLoading) {
            challengeRefUsername.current?.focus('#username');
        }
    }, [challengeLoading]);

    const handleChallengeLoaded = (logs) => {
        challengeLogRef.current = challengeLogRef.current.concat(logs);
        incrementChallengeCounters();
    };

    const handleChallengeLoadingError = (logs) => {
        challengeLogRef.current = challengeLogRef.current.concat(logs);
        errorRef.current = true;
        incrementChallengeCounters();
    };

    if (errorRef.current) {
        return <ChallengeError />;
    }

    return (
        <>
            {challengeLoading ? (
                <div className="text-center mb2">
                    <FullLoader className="color-primary" size={200} />
                </div>
            ) : null}
            <form
                className={classnames(['flex-item-fluid-auto', challengeLoading && 'hidden'])}
                onSubmit={(e) => {
                    e.preventDefault();
                    if (!onFormSubmit()) {
                        return;
                    }
                    withLoading(handleSubmit());
                }}
                autoComplete="off"
                noValidate
            >
                <Row>
                    <Label htmlFor="username">
                        <span className="mr0-5">{c('Label').t`Username`}</span>
                        <Info
                            title={c('Tooltip')
                                .t`Username which is used for all Proton services. This can also be used later to create a secure ProtonMail account.`}
                        />
                    </Label>
                    <Field className="wauto flex-item-fluid">
                        <Challenge
                            hasSizeObserver
                            challengeRef={challengeRefUsername}
                            type="0"
                            name="username"
                            onSuccess={handleChallengeLoaded}
                            onError={handleChallengeLoadingError}
                        >
                            <InputFieldTwo
                                autoFocus
                                id="username"
                                name="username"
                                placeholder={c('Placeholder').t`Username`}
                                error={validator([asyncUsernameError, requiredValidator(username)].filter(isTruthy))}
                                value={username}
                                onChange={handleChangeUsername}
                            />
                        </Challenge>
                    </Field>
                </Row>

                <Row>
                    <Label htmlFor="password">
                        <span className="mr0-5">{c('Label').t`Password`}</span>
                        <Info
                            title={c('Tooltip')
                                .t`If you forget your password, you will no longer have access to your account or your data. Please save it someplace safe.`}
                        />
                    </Label>
                    <Field className="wauto flex-item-fluid">
                        <InputFieldTwo
                            rootClassName="mb1"
                            as={PasswordInputTwo}
                            id="password"
                            name="password"
                            autoComplete="off"
                            placeholder={c('Placeholder').t`Password`}
                            assistiveText={getMinPasswordLengthMessage()}
                            error={validator([passwordLengthValidator(password)])}
                            value={password}
                            onValue={setPassword}
                            disableChange={loading}
                        />

                        <InputFieldTwo
                            as={PasswordInputTwo}
                            id="passwordConfirmation"
                            name="passwordConfirmation"
                            autoComplete="off"
                            placeholder={c('Placeholder').t`Confirm password`}
                            value={confirmPassword}
                            onValue={setConfirmPassword}
                            error={validator([
                                passwordLengthValidator(confirmPassword),
                                confirmPasswordValidator(password, confirmPassword),
                            ])}
                            disableChange={loading}
                        />
                    </Field>
                </Row>

                <Row>
                    <Label htmlFor="email">
                        <span className="mr0-5">{c('Label').t`Email address`}</span>
                        <Info
                            title={c('Tooltip')
                                .t`Your email is not shared with third parties and is only used for recovery and account-related questions or communication.`}
                        />
                    </Label>
                    <Field className="wauto flex-item-fluid">
                        <div className="mb1">
                            <Challenge
                                hasSizeObserver
                                challengeRef={challengeRefEmail}
                                type="1"
                                name="recovery"
                                onSuccess={handleChallengeLoaded}
                                onError={handleChallengeLoadingError}
                            >
                                <InputFieldTwo
                                    id="email"
                                    type="email"
                                    value={email}
                                    onValue={setEmail}
                                    error={validator([requiredValidator(email), emailValidator(email)])}
                                    onKeyDown={(e) => {
                                        if (!onFormSubmit()) {
                                            return;
                                        }
                                        if (e.key === 'Enter') {
                                            withLoading(handleSubmit());
                                        }
                                    }}
                                />
                            </Challenge>
                        </div>
                        <p>
                            {c('Info')
                                .jt`By clicking Create account you agree to abide by our ${termsOfServiceLink} and ${privacyPolicyLink}.`}
                        </p>

                        <Button type="submit" color="norm" loading={loading}>
                            {c('Action').t`Create account`}
                        </Button>
                    </Field>
                </Row>
            </form>
        </>
    );
};

AccountForm.propTypes = {
    model: PropTypes.object.isRequired,
    onSubmit: PropTypes.func.isRequired,
};

export default AccountForm;
