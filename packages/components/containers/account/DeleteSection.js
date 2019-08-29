import React from 'react';
import { c } from 'ttag';
import {
    SubTitle,
    Alert,
    MozillaInfoPanel,
    ErrorButton,
    useModals,
    useUser,
    useSubscription,
    Loader,
    useAddresses,
    useConfig
} from 'react-components';
import { CLIENT_TYPES } from 'proton-shared/lib/constants';

import DeleteAccountModal from './DeleteAccountModal';

const { VPN } = CLIENT_TYPES;

const DeleteSection = () => {
    const [{ isMember }] = useUser();
    const [addresses, loading] = useAddresses();
    const [{ isManagedByMozilla } = {}] = useSubscription();
    const { createModal } = useModals();
    const { CLIENT_TYPE } = useConfig();

    if (loading) {
        return <Loader />;
    }

    // For ProtonVPN, if the user has PM mailbox, we don't display this section to avoid mistake
    if (CLIENT_TYPE === VPN && addresses.length) {
        return null;
    }

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
