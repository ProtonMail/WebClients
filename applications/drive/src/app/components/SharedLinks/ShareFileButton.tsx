import { c } from 'ttag';
import { FloatingButton, Icon, SidebarPrimaryButton, useModals } from '@proton/components';
import SelectedFileToShareModal from '../SelectedFileToShareModal';

interface Props {
    shareId: string;
    floating?: boolean;
    className?: string;
}

const ShareFileButton = ({ shareId, floating, className }: Props) => {
    const { createModal } = useModals();

    const onShareFile = () => {
        if (shareId) {
            createModal(<SelectedFileToShareModal shareId={shareId} />);
        }
    };

    return (
        <>
            {floating ? (
                <FloatingButton onClick={onShareFile} title={c('Action').t`Share file`} disabled={!shareId}>
                    <Icon size={24} name="link" className="mauto" />
                </FloatingButton>
            ) : (
                <SidebarPrimaryButton className={className} disabled={!shareId} onClick={onShareFile}>{c('Action')
                    .t`Share file`}</SidebarPrimaryButton>
            )}
        </>
    );
};

export default ShareFileButton;
