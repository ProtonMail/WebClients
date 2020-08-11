import React from 'react';
import { c } from 'ttag';
import {
    Href,
    Alert,
    MozillaInfoPanel,
    ErrorButton,
    useModals,
    useUser,
    useSubscription,
    Loader,
    useAddresses,
    useConfig,
} from 'react-components';
import { APPS } from 'proton-shared/lib/constants';

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
                {addresses.length
                    ? c('Info')
                          .t`Deleting your account will permanently delete your emails, and you will lose your email address.`
                    : c('Info')
                          .t`Deleting your account will permanently delete all data associated with it and it cannot be recovered. You will no longer be able to use the same username should you decide to create a new account.`}
            </Alert>
            <ErrorButton id="deleteButton" onClick={() => createModal(<DeleteAccountModal />)}>
                {c('Action').t`Delete your account`}
            </ErrorButton>
        </>
    );
};

export default DeleteSection;
