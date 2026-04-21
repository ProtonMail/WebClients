import { c } from 'ttag';

import { useMeetDispatch } from '@proton/meet/store/hooks';
import { dismissPermissionsModal } from '@proton/meet/store/slices/deviceManagementSlice';
import blockedIcon from '@proton/styles/assets/img/meet/blocked-icon.svg';

import { ConfirmationModal } from '../../../components/ConfirmationModal/ConfirmationModal';

export const PermissionsBlockedScreenShareModal = () => {
    const dispatch = useMeetDispatch();

    const handleContinueWithout = () => {
        dispatch(dismissPermissionsModal());
    };

    return (
        <ConfirmationModal
            icon={
                <img
                    className="mx-auto w-custom h-custom"
                    src={blockedIcon}
                    alt=""
                    style={{ '--w-custom': '5rem', '--h-custom': '5rem' }}
                />
            }
            title={c('Title').t`Screen share is blocked`}
            message={c('Info')
                .t`Your browser has blocked access to your screen share. To enable it, update your browser settings and rejoin the call.`}
            primaryText={c('Action').t`Close`}
            onPrimaryAction={handleContinueWithout}
            onClose={handleContinueWithout}
        />
    );
};
