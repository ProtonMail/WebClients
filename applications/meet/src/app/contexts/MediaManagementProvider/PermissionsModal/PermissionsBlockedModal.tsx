import { c } from 'ttag';

import { useMeetDispatch } from '@proton/meet/store/hooks';
import { dismissPermissionsModal } from '@proton/meet/store/slices/deviceManagementSlice';
import { isMobile } from '@proton/shared/lib/helpers/browser';
import blockedIcon from '@proton/styles/assets/img/meet/blocked-icon.svg';

import { ConfirmationModal } from '../../../components/ConfirmationModal/ConfirmationModal';

export const PermissionsBlockedModal = () => {
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
            title={c('Title').t`Camera and microphone are blocked`}
            message={c('Error').t`To use them, allow them in your browser settings, then rejoin the call.`}
            primaryText={c('Action').t`Continue without camera and microphone`}
            onPrimaryAction={handleContinueWithout}
            onClose={handleContinueWithout}
        />
    );
};
