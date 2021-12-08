import { c } from 'ttag';

import { FloatingButton, SidebarPrimaryButton, Icon } from '@proton/components';

import { useActions, useIsEmptyTrashButtonAvailable } from '../../../store';
import useActiveShare from '../../../hooks/drive/useActiveShare';

interface Props {
    mobileVersion?: boolean;
}

const EmptyTrashSidebarButton = ({ mobileVersion = false }: Props) => {
    const { activeShareId } = useActiveShare();
    const { emptyTrash } = useActions();
    const disabled = !useIsEmptyTrashButtonAvailable(activeShareId);

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
