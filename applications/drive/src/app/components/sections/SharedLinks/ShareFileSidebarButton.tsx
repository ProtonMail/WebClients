import { c } from 'ttag';

import { FloatingButton, Icon, SidebarPrimaryButton } from '@proton/components';

import useActiveShare from '../../../hooks/drive/useActiveShare';
import { useFileSharingModal } from '../../modals/SelectLinkToShareModal/SelectLinkToShareModal';
import { useLinkSharingModal } from '../../modals/ShareLinkModal/ShareLinkModal';

interface Props {
    mobileVersion?: boolean;
}

const ShareFileSidebarButton = ({ mobileVersion }: Props) => {
    const { activeShareId } = useActiveShare();
    const [fileSharingModal, showFileSharingModal] = useFileSharingModal();
    const [linkSharingModal, showLinkSharingModal] = useLinkSharingModal();

    const onShareFile = () => {
        if (activeShareId) {
            void showFileSharingModal({ shareId: activeShareId, showLinkSharingModal });
        }
    };

    return (
        <>
            {mobileVersion ? (
                <FloatingButton onClick={onShareFile} title={c('Action').t`Share item`} disabled={!activeShareId}>
                    <Icon size={24} name="link" className="m-auto" />
                </FloatingButton>
            ) : (
                <SidebarPrimaryButton className="hidden md:flex" disabled={!activeShareId} onClick={onShareFile}>
                    {c('Action').t`Share item`}
                </SidebarPrimaryButton>
            )}
            {fileSharingModal}
            {linkSharingModal}
        </>
    );
};

export default ShareFileSidebarButton;
