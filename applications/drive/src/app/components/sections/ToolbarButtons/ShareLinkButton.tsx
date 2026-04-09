import { c } from 'ttag';

import { ToolbarButton } from '@proton/components';
import { generateNodeUid, getDrive } from '@proton/drive';
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
                // Forced to getDrive as it's legacy stuff not used in shared with me or shared by me
                onClick={() => showSharingModal({ nodeUid: generateNodeUid(volumeId, linkId), drive: getDrive() })}
                data-testid="toolbar-share-link"
            />
            {sharingModal}
        </>
    );
};

export default ShareLinkButton;
