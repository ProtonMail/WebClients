import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import {
    Row,
    Label,
    TextArea,
    EmailInput,
    PasswordInput,
    Input,
    Text,
    Modal,
    ContentModal,
    FooterModal,
    ResetButton,
    ErrorButton,
    Alert,
    useAddresses,
    useApiWithoutResult,
    useUser,
    useNotifications,
    useUserSettings,
    useApi,
    useAuthenticationStore
} from 'react-components';
import { deleteUser } from 'proton-shared/lib/api/user';
import { reportBug } from 'proton-shared/lib/api/reports';
import { srpAuth } from 'proton-shared/lib/srp';

const DeleteAccountModal = ({ show, onClose, clientType }) => {
    const { createNotification } = useNotifications();
    const api = useApi();
    const authenticationStore = useAuthenticationStore();
    const [{ isAdmin, Name }] = useUser();
    const [{ TwoFactor }] = useUserSettings();
    const [addresses = []] = useAddresses();
    const [{ Email } = {}] = addresses;
    const { request: requestDeleteUser, loading: loadingDeleteUser } = useApiWithoutResult(deleteUser);
    const { request: requestReportBug, loading: loadingReportBug } = useApiWithoutResult(reportBug);
    const [model, setModel] = useState({
        feedback: '',
        email: '',
        password: '',
        twoFa: ''
    });
    const [loading, setLoading] = useState(false);
    const handleChange = (key) => ({ target }) => setModel({ ...model, [key]: target.value });

    const handleSubmit = async () => {
        await srpAuth({
            api,
            credentials: { password: model.password, totp: model.twoFa },
            config: requestDeleteUser()
        });

        if (isAdmin) {
            await requestReportBug({
                OS: '--',
                OSVersion: '--',
                Browser: '--',
                BrowserVersion: '--',
                BrowserExtensions: '--',
                Client: '--',
                ClientVersion: '--',
                ClientType: clientType,
                Title: `[DELETION FEEDBACK] ${Name}`,
                Username: Name,
                Email: model.email || Email,
                Description: model.feedback
            });
        }
        onClose();
        createNotification({ text: c('Success').t`Account deleted` });
        authenticationStore.logout();
    };

    useEffect(() => {
        setLoading(loadingDeleteUser || loadingReportBug);
    }, [loadingDeleteUser, loadingReportBug]);

    return (
        <Modal show={show} onClose={onClose} title={c('Title').t`Delete account`} type="small">
            <ContentModal onSubmit={handleSubmit} onReset={onClose} loading={loading}>
                <Alert type="warning">
                    <div className="bold uppercase">{c('Info')
                        .t`Warning: This also deletes all connected services`}</div>
                    <div>{c('Info')
                        .t`Example: ProtonContact ProtonVPN, ProtonWallet, ProtonDrive, ProtonCalendar`}</div>
                </Alert>
                <Alert type="warning" learnMore="https://protonmail.com/support/knowledge-base/combine-accounts/">
                    <div className="bold uppercase">{c('Info').t`Warning: deletion is permanent`}</div>
                    <div>{c('Info')
                        .t`If you wish to delete this account in order to combine it with another one, do NOT delete it.`}</div>
                </Alert>
                <Row>
                    <Label htmlFor="feedback">{c('Label').t`Feedback`}</Label>
                    <TextArea
                        id="feedback"
                        autoFocus
                        required
                        value={model.feedback}
                        placeholder={c('Placeholder').t`Feedback`}
                        onChange={handleChange('feedback')}
                        disabled={loading}
                    />
                </Row>
                <Row>
                    <Label htmlFor="email">{c('Label').t`Email address (optional)`}</Label>
                    <div>
                        <EmailInput
                            id="email"
                            disabled={loading}
                            value={model.email}
                            onChange={handleChange('email')}
                            placeholder={c('Placeholder').t`Email address`}
                        />
                        <br />
                        <Text>{c('Info').t`Please provide an email address in case we need to contact you.`}</Text>
                    </div>
                </Row>
                <Row>
                    <Label htmlFor="password">{c('Label').t`Login password`}</Label>
                    <div>
                        <PasswordInput
                            id="password"
                            disabled={loading}
                            value={model.password}
                            onChange={handleChange('password')}
                            placeholder={c('Placeholder').t`Password`}
                        />
                        <br />
                        <Text>{c('Info').t`Enter your login password to confirm your identity.`}</Text>
                    </div>
                </Row>
                {TwoFactor ? (
                    <Row>
                        <Label htmlFor="twoFa">{c('Label').t`Two-factor passcode`}</Label>
                        <Input
                            id="twoFa"
                            disabled={loading}
                            value={model.twoFa}
                            onChange={handleChange('twoFa')}
                            placeholder={c('Placeholder').t`Two-factor passcode`}
                        />
                    </Row>
                ) : null}
                <FooterModal>
                    <ResetButton disabled={loading}>{c('Action').t`Cancel`}</ResetButton>
                    <ErrorButton type="submit" disabled={loading}>{c('Action').t`Delete`}</ErrorButton>
                </FooterModal>
            </ContentModal>
        </Modal>
    );
};

DeleteAccountModal.propTypes = {
    clientType: PropTypes.number.isRequired,
    show: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired
};

export default DeleteAccountModal;
