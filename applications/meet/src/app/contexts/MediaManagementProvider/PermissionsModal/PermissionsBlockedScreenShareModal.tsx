import { c } from 'ttag';

import { useMeetDispatch } from '@proton/meet/store/hooks';
import { dismissPermissionsModal } from '@proton/meet/store/slices/deviceManagementSlice';
import { isMobile } from '@proton/shared/lib/helpers/browser';
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
                    style={
                        isMobile()
                            ? {
                                  '--w-custom': '3rem',
                                  '--h-custom': '3rem',
                              }
                            : {
                                  '--w-custom': '5rem',
                                  '--h-custom': '5rem',
                              }
                    }
                />
            }
            title={c('Title').t`Screen share is blocked`}
            message={c('Error').t`To share your screen, allow it in your browser settings, then rejoin the call.`}
            primaryText={c('Action').t`Close`}
            onPrimaryAction={handleContinueWithout}
            onClose={handleContinueWithout}
        />
    );
};
