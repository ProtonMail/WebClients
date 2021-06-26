import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { Loader, useApi, useNotifications } from '@proton/components';
import { checkInvitation } from '@proton/shared/lib/api/invites';
import { INVITE_TYPES } from '@proton/shared/lib/constants';
import { c } from 'ttag';
import SignInLayout from '../components/layout/SignInLayout';

const { VPN } = INVITE_TYPES;

const PreInviteContainer = ({ history, match }) => {
    const { createNotification } = useNotifications();
    const { token, selector } = match.params;
    const api = useApi();

    const invalid = () => {
        createNotification({ text: c('Error').t`Invalid invitation link`, type: 'error' });
        history.push('/login');
    };

    useEffect(() => {
        if (!token || !selector) {
            return invalid();
        }

        api(checkInvitation({ Selector: selector, Token: token, Type: VPN }))
            .then(({ Valid }) => {
                if (!Valid) {
                    return invalid();
                }

                history.push({
                    pathname: '/signup',
                    state: { invite: { selector, token } },
                });
            })
            .catch(() => {
                invalid();
            });
    }, []);

    return (
        <SignInLayout title={c('Title').t`Checking invitation parameters`}>
            <Loader />
        </SignInLayout>
    );
};

PreInviteContainer.propTypes = {
    history: PropTypes.object.isRequired,
    match: PropTypes.object.isRequired,
};

export default PreInviteContainer;
