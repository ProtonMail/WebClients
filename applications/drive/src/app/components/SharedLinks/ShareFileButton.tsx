import React from 'react';
import { c } from 'ttag';
import { FloatingButton, SidebarPrimaryButton, useModals } from 'react-components';
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
                <FloatingButton
                    onClick={onShareFile}
                    title={c('Action').t`Share file`}
                    icon="empty-folder"
                    disabled={!shareId}
                />
            ) : (
                <SidebarPrimaryButton className={className} disabled={!shareId} onClick={onShareFile}>{c('Action')
                    .t`Share file`}</SidebarPrimaryButton>
            )}
        </>
    );
};

export default ShareFileButton;
