import { c } from 'ttag';

import { ToolbarButton } from '@proton/components';
import { generateNodeUid } from '@proton/drive/index';
import { IcUserPlus } from '@proton/icons/icons/IcUserPlus';

import { useSharingModal } from '../../../modals/SharingModal/SharingModal';

interface Props {
    volumeId: string;
    linkId: string;
}

const ShareLinkButton = ({ volumeId, linkId }: Props) => {
    const { sharingModal, showSharingModal } = useSharingModal();
    return (
        <>
            <ToolbarButton
                title={c('Action').t`Share`}
                icon={<IcUserPlus alt={c('Action').t`Share`} />}
                onClick={() => showSharingModal({ nodeUid: generateNodeUid(volumeId, linkId) })}
                data-testid="toolbar-share-link"
            />
            {sharingModal}
        </>
    );
};

export default ShareLinkButton;
