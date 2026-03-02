import { c } from 'ttag';

import { ToolbarButton } from '@proton/components';
import { IcUserPlus } from '@proton/icons/icons/IcUserPlus';

import { useFileSharingModal } from '../../../modals/SelectLinkToShareModal';
import { useSharingModal } from '../../../modals/SharingModal/SharingModal';

const ShareButton = () => {
    const [fileSharingModal, showFileSharingModal] = useFileSharingModal();
    const { sharingModal, showSharingModal } = useSharingModal();

    return (
        <>
            <ToolbarButton
                title={c('Action').t`Share`}
                icon={<IcUserPlus alt={c('Action').t`Share`} />}
                onClick={() => {
                    void showFileSharingModal({ showSharingModal });
                }}
                data-testid="toolbar-share-via-link"
            />
            {fileSharingModal}
            {sharingModal}
        </>
    );
};

export default ShareButton;
