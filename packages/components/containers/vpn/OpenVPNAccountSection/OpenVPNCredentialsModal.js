import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { updateVPNName, updateVPNPassword } from 'proton-shared/lib/api/vpn';
import { FormModal, Row, Label, Field, Input, PasswordInput } from '../../../components';
import { useLoading, useNotifications, useApi } from '../../../hooks';

const OpenVPNCredentialsModal = ({ username = '', password = '', fetchUserVPN, ...rest }) => {
    const [loading, withLoading] = useLoading();
    const api = useApi();
    const { createNotification } = useNotifications();
    const [credentials, setCredentials] = useState({ username, password });
    const title = c('Title').t`Edit OpenVPN / IKEv2 credentials`;

    const handleChangeUsername = ({ target }) => setCredentials({ ...credentials, username: target.value });
    const handleChangePassword = ({ target }) => setCredentials({ ...credentials, password: target.value });

    const handleSubmit = async () => {
        const RESERVED_USERNAMES = ['guest'];
        if (RESERVED_USERNAMES.includes(credentials.username.toLowerCase())) {
            createNotification({
                text: c('Error').t`'${credentials.username}' is a reserved word. Please set another username.`,
            });
            return;
        }
        await api(updateVPNName(credentials.username));
        await api(updateVPNPassword(credentials.password));
        await fetchUserVPN();
        rest.onClose();
        createNotification({ text: c('Notification').t`OpenVPN / IKEv2 credentials updated` });
    };

    return (
        <FormModal
            loading={loading}
            title={title}
            close={c('Action').t`Cancel`}
            submit={c('Action').t`Update`}
            onSubmit={() => withLoading(handleSubmit())}
            small
            {...rest}
        >
            <Row>
                <Label htmlFor="openvpn-username">{c('Label').t`OpenVPN / IKEv2 username`}</Label>
                <Field>
                    <Input
                        id="openvpn-username"
                        autoComplete="off"
                        value={credentials.username}
                        onChange={handleChangeUsername}
                        required
                    />
                </Field>
            </Row>
            <Row>
                <Label htmlFor="openvpn-password">{c('Label').t`OpenVPN / IKEv2 password`}</Label>
                <Field>
                    <PasswordInput
                        id="openvpn-password"
                        autoComplete="off"
                        value={credentials.password}
                        onChange={handleChangePassword}
                        required
                    />
                </Field>
            </Row>
        </FormModal>
    );
};

OpenVPNCredentialsModal.propTypes = {
    username: PropTypes.string,
    password: PropTypes.string,
    fetchUserVPN: PropTypes.func.isRequired,
};

export default OpenVPNCredentialsModal;
