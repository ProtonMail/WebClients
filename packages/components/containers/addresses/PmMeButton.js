import React from 'react';
import { c } from 'ttag';
import { AddressModal, PrimaryButton, useMembers, useModals } from 'react-components';

const PmMeButton = () => {
    const [members = [], loading] = useMembers();
    const { createModal } = useModals();
    const member = members.find(({ Self }) => Self);

    return (
        <PrimaryButton disabled={loading} onClick={() => createModal(<AddressModal member={member} />)}>
            {c('Action').t`Activate`}
        </PrimaryButton>
    );
};

export default PmMeButton;
