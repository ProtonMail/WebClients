import { c } from 'ttag';

import { FloatingButton, Icon, SidebarPrimaryButton } from '@proton/components';

import useActiveShare from '../../../hooks/drive/useActiveShare';
import { useFileSharingModal } from '../../SelectLinkToShareModal/SelectLinkToShareModal';

interface Props {
    mobileVersion?: boolean;
}

const ShareFileSidebarButton = ({ mobileVersion }: Props) => {
    const { activeShareId } = useActiveShare();
    const [fileSharingModal, showFileSharingModal] = useFileSharingModal();

    const onShareFile = () => {
        if (activeShareId) {
            void showFileSharingModal({ shareId: activeShareId });
        }
    };

    return (
        <>
            {mobileVersion ? (
                <FloatingButton onClick={onShareFile} title={c('Action').t`Share item`} disabled={!activeShareId}>
                    <Icon size={24} name="link" className="mauto" />
                </FloatingButton>
            ) : (
                <SidebarPrimaryButton className="no-mobile" disabled={!activeShareId} onClick={onShareFile}>
                    {c('Action').t`Share item`}
                </SidebarPrimaryButton>
            )}
            {fileSharingModal}
        </>
    );
};

export default ShareFileSidebarButton;
