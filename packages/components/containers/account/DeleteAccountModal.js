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
    useEventManager,
    useUser,
    useNotifications,
    useUserSettings,
    useApi,
    useAuthentication,
    useConfig,
    ErrorButton
} from 'react-components';
import { deleteUser, unlockPasswordChanges } from 'proton-shared/lib/api/user';
import { reportBug } from 'proton-shared/lib/api/reports';
import { srpAuth } from 'proton-shared/lib/srp';
import { collectInfo, getClient } from '../../helpers/report';
import { wait } from 'proton-shared/lib/helpers/promise';

const DeleteAccountModal = ({ onClose, ...rest }) => {
    const { createNotification } = useNotifications();
    const eventManager = useEventManager();
    const api = useApi();
    const authentication = useAuthentication();
    const [{ isAdmin, Name } = {}] = useUser();
    const [{ TwoFactor } = {}] = useUserSettings();
    const [loading, setLoading] = useState(false);
    const [model, setModel] = useState({
        feedback: '',
        email: '',
        password: '',
        twoFa: ''
    });
    const { CLIENT_ID, APP_VERSION, CLIENT_TYPE } = useConfig();
    const Client = getClient(CLIENT_ID);

    const handleChange = (key) => ({ target }) => setModel({ ...model, [key]: target.value });

    const handleSubmit = async () => {
        try {
            setLoading(true);

            eventManager.stop();

            await srpAuth({
                api,
                credentials: { password: model.password, totp: model.twoFa },
                config: unlockPasswordChanges()
            });

            if (isAdmin) {
                await api(
                    reportBug({
                        ...collectInfo(),
                        Client,
                        ClientVersion: APP_VERSION,
                        ClientType: CLIENT_TYPE,
                        Title: `[DELETION FEEDBACK] ${Name}`,
                        Username: Name,
                        Email: model.email,
                        Description: model.feedback
                    })
                );
            }

            await api(deleteUser());

            createNotification({ text: c('Success').t`Account deleted. Logging out...` });

            // Add an artificial delay to show the notification.
            await wait(2500);

            onClose();
            authentication.logout();
        } catch (error) {
            eventManager.start();
            setLoading(false);
            throw error;
        }
    };

    return (
        <FormModal
            onSubmit={handleSubmit}
            onClose={onClose}
            close={c('Action').t`Cancel`}
            submit={<ErrorButton loading={loading} type="submit">{c('Action').t`Delete`}</ErrorButton>}
            title={c('Title').t`Delete account`}
            loading={loading}
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
                <Label htmlFor="email">{c('Label').t`Email address`}</Label>
                <Field>
                    <EmailInput
                        id="email"
                        required={true}
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
