import React from 'react';
import { c } from 'ttag';
import {
    SubTitle,
    Label,
    Row,
    MozillaInfoPanel,
    ErrorButton,
    useModal,
    useUser,
    useSubscription
} from 'react-components';

import DeleteAccountModal from './DeleteAccountModal';

const DeleteSection = () => {
    const { isMember } = useUser();
    const { isManagedByMozilla } = useSubscription();
    const { isOpen, open, close } = useModal();
    // TODO get clientType from config (proton-pack)

    if (isMember) {
        return null;
    }

    if (isManagedByMozilla) {
        return (
            <>
                <SubTitle>{c('Title').t`Delete account`}</SubTitle>
                <MozillaInfoPanel />
            </>
        );
    }

    return (
        <>
            <Row>
                <Label htmlFor="deleteButton">{c('Label').t`Irreversible action`}</Label>
                <ErrorButton id="deleteButton" onClick={open}>{c('Action').t`Delete your account`}</ErrorButton>
                <DeleteAccountModal show={isOpen} onClose={close} clientType={1} />
            </Row>
        </>
    );
};

export default DeleteSection;
