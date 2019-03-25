import React from 'react';
import { c } from 'ttag/types';
import { AddressModal, PrimaryButton, useMembers, useModal } from 'react-components';

const PmMeButton = () => {
    const [members, loading] = useMembers();
    const member = members.find(({ Self }) => Self);
    const { isOpen, open, close } = useModal();

    return (
        <>
            <PrimaryButton disabled={loading} onClick={open}>{c('Action').t`Activate`}</PrimaryButton>
            <AddressModal show={isOpen} onClose={close} member={member} />
        </>
    );
};

export default PmMeButton;
