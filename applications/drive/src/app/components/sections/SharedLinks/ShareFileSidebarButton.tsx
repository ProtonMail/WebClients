import { c } from 'ttag';

import { FloatingButton, Icon, SidebarPrimaryButton, useModals } from '@proton/components';

import useActiveShare from '../../../hooks/drive/useActiveShare';
import SelectedFileToShareModal from '../../SelectedFileToShareModal/SelectedFileToShareModal';

interface Props {
    mobileVersion?: boolean;
}

const ShareFileSidebarButton = ({ mobileVersion }: Props) => {
    const { activeShareId } = useActiveShare();
    const { createModal } = useModals();

    const onShareFile = () => {
        if (activeShareId) {
            createModal(<SelectedFileToShareModal shareId={activeShareId} />);
        }
    };

    return mobileVersion ? (
        <FloatingButton onClick={onShareFile} title={c('Action').t`Share file`} disabled={!activeShareId}>
            <Icon size={24} name="link" className="mauto" />
        </FloatingButton>
    ) : (
        <SidebarPrimaryButton className="no-mobile" disabled={!activeShareId} onClick={onShareFile}>
            {c('Action').t`Share file`}
        </SidebarPrimaryButton>
    );
};

export default ShareFileSidebarButton;
