import React from 'react';
import { c } from 'ttag';
import { SubTitle, Alert, MozillaInfoPanel, ErrorButton, useModals, useUser, useSubscription } from 'react-components';

import DeleteAccountModal from './DeleteAccountModal';

const DeleteSection = () => {
    const [{ isMember }] = useUser();
    const [{ isManagedByMozilla } = {}] = useSubscription();
    const { createModal } = useModals();
    // TODO get clientType from config (proton-pack)

    if (isMember) {
        return null;
    }

    const subTitle = <SubTitle>{c('Title').t`Delete account`}</SubTitle>;

    if (isManagedByMozilla) {
        return (
            <>
                {subTitle}
                <MozillaInfoPanel />
            </>
        );
    }

    return (
        <>
            {subTitle}
            <Alert type="error">
                {c('Info')
                    .t`Deleting your account will permanently delete your emails, and you will lose your email address.`}
            </Alert>
            <ErrorButton id="deleteButton" onClick={() => createModal(<DeleteAccountModal />)}>
                {c('Action').t`Delete your account`}
            </ErrorButton>
        </>
    );
};

export default DeleteSection;
