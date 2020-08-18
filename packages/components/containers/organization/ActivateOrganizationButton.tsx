import React from 'react';
import { c } from 'ttag';
import { unlockPasswordChanges } from 'proton-shared/lib/api/user';
import { Organization } from 'proton-shared/lib/interfaces';
import { PrimaryButton } from '../../components';
import { useNotifications, useModals } from '../../hooks';

import AuthModal from '../password/AuthModal';
import SetupOrganizationModal from './SetupOrganizationModal';

interface Props {
    organization?: Organization;
}

const ActivateOrganizationButton = ({ organization }: Props) => {
    const { createNotification } = useNotifications();
    const { createModal } = useModals();

    const handleClick = async () => {
        if (organization?.MaxMembers === 1) {
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
