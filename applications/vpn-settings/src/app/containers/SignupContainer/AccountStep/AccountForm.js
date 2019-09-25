import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
    Input,
    PasswordInput,
    PrimaryButton,
    Field,
    useApi,
    Row,
    Label,
    EmailInput,
    Href,
    useLoading,
    Info
} from 'react-components';
import { c } from 'ttag';
import { queryCheckUsernameAvailability } from 'proton-shared/lib/api/user';

const AccountForm = ({ model, onSubmit }) => {
    const api = useApi();
    const [username, setUsername] = useState(model.username);
    const [password, setPassword] = useState(model.password);
    const [confirmPassword, setConfirmPassword] = useState(model.password);
    const [email, setEmail] = useState(model.email);
    const [usernameError, setUsernameError] = useState();
    const [loading, withLoading] = useLoading();

    const handleChangeUsername = ({ target }) => {
        if (usernameError) {
            setUsernameError(null);
        }
        setUsername(target.value);
    };

    const handleChangePassword = ({ target }) => setPassword(target.value);
    const handleChangeConfirmPassword = ({ target }) => setConfirmPassword(target.value);
    const handleChangeEmail = ({ target }) => setEmail(target.value);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            return;
        }

        try {
            await api(queryCheckUsernameAvailability(username));
            await onSubmit({
                username,
                password,
                email
            });
        } catch (e) {
            setUsernameError(e.data ? e.data.Error : c('Error').t`Can't check username, try again later`);
        }
    };

    const termsOfServiceLink = (
        <Href key="terms" url="https://protonvpn.com/terms-and-conditions">{c('Link').t`Terms of Service`}</Href>
    );

    const privacyPolicyLink = (
        <Href key="privacy" url="https://protonvpn.com/privacy-policy">{c('Link').t`Privacy Policy`}</Href>
    );

    return (
        <form className="flex-item-fluid-auto" onSubmit={(e) => withLoading(handleSubmit(e))}>
            <Row>
                <Label htmlFor="username">
                    <span className="mr0-5">{c('Label').t`Username`}</span>
                    <Info
                        title={c('Tooltip')
                            .t`Username which is used for all Proton services. This can also be used later to create a secure ProtonMail account.`}
                    />
                </Label>
                <Field className="auto flex-item-fluid">
                    <Input
                        required
                        error={usernameError}
                        value={username}
                        onChange={handleChangeUsername}
                        name="username"
                        id="username"
                        autoFocus={true}
                        placeholder={c('Placeholder').t`Username`}
                    />
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
                <Field className="auto flex-item-fluid">
                    <div className="mb1">
                        <PasswordInput
                            id="password"
                            required
                            value={password}
                            onChange={handleChangePassword}
                            name="password"
                            placeholder={c('Placeholder').t`Password`}
                        />
                    </div>
                    <PasswordInput
                        id="passwordConfirmation"
                        required
                        value={confirmPassword}
                        onChange={handleChangeConfirmPassword}
                        error={password !== confirmPassword ? c('Error').t`Passwords do not match` : undefined}
                        name="passwordConfirmation"
                        placeholder={c('Placeholder').t`Confirm password`}
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
                <Field className="auto flex-item-fluid">
                    <div className="mb1">
                        <EmailInput
                            id="email"
                            required
                            value={email}
                            onChange={handleChangeEmail}
                            placeholder={c('Placeholder').t`user@domain.com`}
                        />
                    </div>
                    <p>
                        {c('Info')
                            .jt`By clicking Create account you agree to abide by our ${termsOfServiceLink} and ${privacyPolicyLink}.`}
                    </p>

                    <PrimaryButton loading={loading} type="submit">{c('Action').t`Create account`}</PrimaryButton>
                </Field>
            </Row>
        </form>
    );
};

AccountForm.propTypes = {
    model: PropTypes.object.isRequired,
    onSubmit: PropTypes.func.isRequired
};

export default AccountForm;
