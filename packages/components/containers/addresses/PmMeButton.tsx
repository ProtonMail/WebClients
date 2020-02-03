import React from 'react';
import { c } from 'ttag';
import { AddressModal, PrimaryButton, useMembers, useModals } from '../../index';

const PmMeButton = () => {
    const [members = [], loading] = useMembers();
    const { createModal } = useModals();
    const member = members.find(({ Self }) => Self);

    if (!member) {
        return null;
    }

    return (
        <PrimaryButton disabled={loading} onClick={() => createModal(<AddressModal member={member} />)}>
            {c('Action').t`Activate`}
        </PrimaryButton>
    );
};

export default PmMeButton;
