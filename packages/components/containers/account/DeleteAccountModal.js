import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import {
    Row,
    Field,
    Label,
    TextArea,
    EmailInput,
    PasswordInput,
    TwoFactorInput,
    FormModal,
    Alert,
    useAddresses,
    useApiWithoutResult,
    useUser,
    useNotifications,
    useUserSettings,
    useApi,
    useAuthentication,
    useConfig
} from 'react-components';
import { deleteUser } from 'proton-shared/lib/api/user';
import { reportBug } from 'proton-shared/lib/api/reports';
import { srpAuth } from 'proton-shared/lib/srp';

const DeleteAccountModal = ({ onClose, ...rest }) => {
    const { createNotification } = useNotifications();
    const { CLIENT_TYPE } = useConfig();
    const api = useApi();
    const authentication = useAuthentication();
    const [{ isAdmin, Name } = {}] = useUser();
    const [{ TwoFactor } = {}] = useUserSettings();
    const [addresses = []] = useAddresses();
    const [{ Email } = {}] = addresses;
    const { request } = useApiWithoutResult(reportBug);
    const [loading, setLoading] = useState(false);
    const [model, setModel] = useState({
        feedback: '',
        email: '',
        password: '',
        twoFa: ''
    });

    const handleChange = (key) => ({ target }) => setModel({ ...model, [key]: target.value });

    const handleSubmit = async () => {
        try {
            setLoading(true);
            await srpAuth({
                api,
                credentials: { password: model.password, totp: model.twoFa },
                config: deleteUser()
            });

            if (isAdmin) {
                await request({
                    OS: '--',
                    OSVersion: '--',
                    Browser: '--',
                    BrowserVersion: '--',
                    BrowserExtensions: '--',
                    Client: '--',
                    ClientVersion: '--',
                    ClientType: CLIENT_TYPE,
                    Title: `[DELETION FEEDBACK] ${Name}`,
                    Username: Name,
                    Email: model.email || Email,
                    Description: model.feedback
                });
            }
            setLoading(false);
        } catch (error) {
            setLoading(false);
            throw error;
        }

        onClose();
        createNotification({ text: c('Success').t`Account deleted` });
        authentication.logout();
    };

    return (
        <FormModal
            onSubmit={handleSubmit}
            onClose={onClose}
            title={c('Title').t`Delete account`}
            loading={loading}
            submit={c('Action').t`Delete`}
            {...rest}
        >
            <Alert type="warning">
                <div className="bold uppercase">{c('Info').t`Warning: This also deletes all connected services`}</div>
                <div>{c('Info').t`Example: ProtonMail, ProtonContact, ProtonVPN, ProtonDrive, ProtonCalendar`}</div>
            </Alert>
            <Alert type="warning" learnMore="https://protonmail.com/support/knowledge-base/combine-accounts/">
                <div className="bold uppercase">{c('Info').t`Warning: deletion is permanent`}</div>
                <div>{c('Info')
                    .t`If you wish to delete this account in order to combine it with another one, do NOT delete it.`}</div>
            </Alert>
            <Row>
                <Label htmlFor="feedback">{c('Label').t`Feedback`}</Label>
                <Field>
                    <TextArea
                        id="feedback"
                        autoFocus
                        required
                        value={model.feedback}
                        placeholder={c('Placeholder').t`Feedback`}
                        onChange={handleChange('feedback')}
                        disabled={loading}
                    />
                </Field>
            </Row>
            <Row>
                <Label htmlFor="email">{c('Label').t`Email address (optional)`}</Label>
                <Field>
                    <EmailInput
                        id="email"
                        disabled={loading}
                        value={model.email}
                        onChange={handleChange('email')}
                        placeholder={c('Placeholder').t`Email address`}
                    />
                    <br />
                    {c('Info').t`Please provide an email address in case we need to contact you.`}
                </Field>
            </Row>
            <Row>
                <Label htmlFor="password">{c('Label').t`Login password`}</Label>
                <Field>
                    <PasswordInput
                        id="password"
                        disabled={loading}
                        value={model.password}
                        onChange={handleChange('password')}
                        placeholder={c('Placeholder').t`Password`}
                    />
                    <br />
                    {c('Info').t`Enter your login password to confirm your identity.`}
                </Field>
            </Row>
            {TwoFactor ? (
                <Row>
                    <Label htmlFor="twoFa">{c('Label').t`Two-factor code`}</Label>
                    <Field>
                        <TwoFactorInput
                            id="twoFa"
                            disabled={loading}
                            value={model.twoFa}
                            onChange={handleChange('twoFa')}
                            placeholder={c('Placeholder').t`Two-factor code`}
                        />
                    </Field>
                </Row>
            ) : null}
        </FormModal>
    );
};

DeleteAccountModal.propTypes = {
    onClose: PropTypes.func
};

export default DeleteAccountModal;
