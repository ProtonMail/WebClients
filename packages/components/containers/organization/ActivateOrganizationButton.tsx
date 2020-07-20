import React from 'react';
import { c } from 'ttag';
import { PrimaryButton, AuthModal, useOrganization, useNotifications, useModals } from '../../index';
import { unlockPasswordChanges } from 'proton-shared/lib/api/user';

import SetupOrganizationModal from './SetupOrganizationModal';

const ActivateOrganizationButton = () => {
    const [{ MaxMembers }] = useOrganization();
    const { createNotification } = useNotifications();
    const { createModal } = useModals();

    const handleClick = async () => {
        if (MaxMembers === 1) {
            return createNotification({
                type: 'error',
                text: c('Error')
                    .t`Please upgrade to a Professional plan with more than 1 user, or a Visionary account, to get multi-user support.`,
            });
        }

        await new Promise((resolve, reject) => {
            createModal(<AuthModal onClose={reject} onSuccess={resolve} config={unlockPasswordChanges()} />);
        });
        createModal(<SetupOrganizationModal />);
    };
    return <PrimaryButton onClick={handleClick}>{c('Action').t`Enable multi-user support`}</PrimaryButton>;
};

export default ActivateOrganizationButton;
