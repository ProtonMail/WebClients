import { useModalTwoStatic } from '@proton/components';

import { SharingModal } from '../../../modals/SharingModal/SharingModal';

export type SharingModalProps = {
    volumeId: string;
    modalTitleID?: string;
    shareId: string;
    linkId: string;
    onPublicLinkToggle?: (enabled: boolean) => void;
    /**
     * Escape hatch that is necessary for Docs. Please do not use unless you know what you are doing.
     *
     * The reason behind this workaround is stale cache issues. See MR for more details.
     */
    registerOverriddenNameListener?: (listener: (name: string) => void) => void;
    // Not used here but it's to match new sdk modal type
    isAlbum?: boolean;
};

export const useLinkSharingModal = () => {
    return useModalTwoStatic(SharingModal);
};
