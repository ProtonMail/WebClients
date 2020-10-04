import React from 'react';
import { APPS } from 'proton-shared/lib/constants';
import { c } from 'ttag';
import { Href, Alert, Loader, ErrorButton } from '../../components';
import { useModals, useUser, useSubscription, useAddresses, useConfig } from '../../hooks';

import MozillaInfoPanel from './MozillaInfoPanel';
import DeleteAccountModal from './DeleteAccountModal';

const DeleteSection = () => {
    const [{ isMember }] = useUser();
    const [addresses, loading] = useAddresses();
    const [{ isManagedByMozilla } = {}] = useSubscription();
    const { createModal } = useModals();
    const { APP_NAME } = useConfig();

    if (loading) {
        return <Loader />;
    }

    if (APP_NAME === APPS.PROTONVPN_SETTINGS && addresses.length) {
        const loginLink = (
            <Href key="0" url="https://mail.protonmail.com/login">
                mail.protonmail.com
            </Href>
        );

        return (
            <Alert>{c('Info')
                .jt`Your ProtonVPN and ProtonMail accounts are linked. To delete them both, please log in at ${loginLink} and delete your account there.`}</Alert>
        );
    }

    if (isMember) {
        return null;
    }

    if (isManagedByMozilla) {
        return <MozillaInfoPanel />;
    }

    return (
        <>
            <Alert type="error">
                {c('Info')
                    .t`This will permanently delete all data associated with your account. You will not be able to reactivate this account.`}
            </Alert>
            <ErrorButton id="deleteButton" onClick={() => createModal(<DeleteAccountModal />)}>
                {c('Action').t`Delete your account`}
            </ErrorButton>
        </>
    );
};

export default DeleteSection;
