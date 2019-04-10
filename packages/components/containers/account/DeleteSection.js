import React from 'react';
import { c } from 'ttag';
import { SubTitle, Label, Row, ErrorButton, useModal } from 'react-components';

import DeleteAccountModal from './DeleteAccountModal';

const DeleteSection = () => {
    const { isOpen, open, close } = useModal();
    // TODO get clientType from config (proton-pack)
    return (
        <>
            <SubTitle>{c('Title').t`Delete account`}</SubTitle>
            <Row>
                <Label htmlFor="deleteButton">{c('Label').t`Irreversible action`}</Label>
                <ErrorButton id="deleteButton" onClick={open}>{c('Action').t`Delete your account`}</ErrorButton>
                <DeleteAccountModal show={isOpen} onClose={close} clientType={1} />
            </Row>
        </>
    );
};

export default DeleteSection;
