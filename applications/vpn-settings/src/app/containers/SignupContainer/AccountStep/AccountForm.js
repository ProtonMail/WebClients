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
    Alert,
    useLoading,
    Info
} from 'react-components';
import { c } from 'ttag';
import { queryCheckUsernameAvailability } from 'proton-shared/lib/api/user';

const AccountForm = ({ onSubmit }) => {
    const api = useApi();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');
    const [usernameError, setUsernameError] = useState();
    const [loading, withLoading] = useLoading();

    const handleChangeUsername = ({ target }) => {
        if (usernameError) {
            setUsernameError(null);
        }
        setUsername(target.value);
    };

    const handleChangePassword = ({ target }) => setPassword(target.value);
    const handleChangeEmail = ({ target }) => setEmail(target.value);

    const handleSubmit = async (e) => {
        e.preventDefault();
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

    const termsAndConditionsLink = (
        <Href key="0" url="https://protonvpn.com/terms-and-conditions">{c('Link').t`terms and conditions`}</Href>
    );

    return (
        <form onSubmit={(e) => withLoading(handleSubmit(e))}>
            <Row>
                <Label htmlFor="username">
                    <span className="mr0-5">{c('Label').t`Username`}</span>
                    <Info
                        title={c('Tooltip')
                            .t`Username which is used for all Proton services. This can also be used later to create a secure ProtonMail account.`}
                    />
                </Label>
                <Field>
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
                <Field>
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
                        name="passwordConfirmation"
                        pattern={password}
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
                <Field>
                    <div className="mb1">
                        <EmailInput
                            id="email"
                            required
                            value={email}
                            onChange={handleChangeEmail}
                            placeholder={c('Placeholder').t`user@domain.com`}
                        />
                    </div>
                    <Alert>
                        {c('Info')
                            .jt`By clicking Create account you agree to abide by Proton's ${termsAndConditionsLink}.`}
                    </Alert>

                    <PrimaryButton loading={loading} type="submit">{c('Action').t`Create account`}</PrimaryButton>
                </Field>
            </Row>
        </form>
    );
};

AccountForm.propTypes = {
    onSubmit: PropTypes.func.isRequired
};

export default AccountForm;
