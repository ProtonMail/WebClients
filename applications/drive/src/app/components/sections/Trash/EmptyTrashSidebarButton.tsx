import { c } from 'ttag';

import { FloatingButton, Icon, SidebarPrimaryButton } from '@proton/components';

import useActiveShare from '../../../hooks/drive/useActiveShare';
import { useActions, useIsEmptyTrashButtonAvailable } from '../../../store';

interface Props {
    mobileVersion?: boolean;
}

const EmptyTrashSidebarButton = ({ mobileVersion = false }: Props) => {
    const { activeShareId } = useActiveShare();
    const { emptyTrash } = useActions();
    const disabled = !useIsEmptyTrashButtonAvailable();

    const handleEmptyTrashClick = () => {
        void emptyTrash(new AbortController().signal, activeShareId);
    };

    return mobileVersion ? (
        <FloatingButton
            disabled={disabled}
            color="danger"
            onClick={handleEmptyTrashClick}
            title={c('Action').t`Empty trash`}
        >
            <Icon size={24} name="broom" className="mauto" />
        </FloatingButton>
    ) : (
        <SidebarPrimaryButton color="danger" className="no-mobile" disabled={disabled} onClick={handleEmptyTrashClick}>
            {c('Action').t`Empty trash`}
        </SidebarPrimaryButton>
    );
};

export default EmptyTrashSidebarButton;
