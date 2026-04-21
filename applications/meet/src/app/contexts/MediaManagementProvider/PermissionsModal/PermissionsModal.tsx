import { useMeetSelector } from '@proton/meet/store/hooks';
import { PermissionsModalType, selectPermissionsModals } from '@proton/meet/store/slices';

import { PermissionsBlockedCameraModal } from './PermissionsBlockedCameraModal';
import { PermissionsBlockedMicrophoneModal } from './PermissionsBlockedMicrophoneModal';
import { PermissionsBlockedModal } from './PermissionsBlockedModal';
import { PermissionsBlockedScreenShareModal } from './PermissionsBlockedScreenShareModal';
import { PermissionsNeededModal } from './PermissionsNeededModal';

export const PermissionsModal = () => {
    const { permissionsModal } = useMeetSelector(selectPermissionsModals);

    switch (permissionsModal) {
        case PermissionsModalType.PERMISSIONS_MODAL:
            return <PermissionsNeededModal />;
        case PermissionsModalType.PERMISSIONS_BLOCKED_MODAL:
            return <PermissionsBlockedModal />;
        case PermissionsModalType.PERMISSIONS_BLOCKED_CAMERA_MODAL:
            return <PermissionsBlockedCameraModal />;
        case PermissionsModalType.PERMISSIONS_BLOCKED_MICROPHONE_MODAL:
            return <PermissionsBlockedMicrophoneModal />;
        case PermissionsModalType.PERMISSIONS_BLOCKED_SCREEN_SHARE_MODAL:
            return <PermissionsBlockedScreenShareModal />;
        default:
            return null;
    }
};
