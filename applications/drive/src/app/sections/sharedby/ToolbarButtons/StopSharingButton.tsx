import { c } from 'ttag';

import { Icon, ToolbarButton } from '@proton/components';

import { useActions } from '../../../store';

interface StopSharingButtonProps {
    shareId: string;
}

const StopSharingButton = ({ shareId }: StopSharingButtonProps) => {
    const { stopSharing, confirmModal } = useActions();

    return (
        <>
            <ToolbarButton
                title={c('Action').t`Stop sharing`}
                icon={<Icon name="link-slash" />}
                onClick={() => stopSharing(shareId)}
                data-testid="toolbar-button-stop-sharing"
            />
            {confirmModal}
        </>
    );
};

export default StopSharingButton;
