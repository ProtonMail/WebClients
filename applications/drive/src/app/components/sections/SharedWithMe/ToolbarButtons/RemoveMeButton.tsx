import { c } from 'ttag';

import { Icon, ToolbarButton, useConfirmActionModal } from '@proton/components';

import { useSharedWithMeActions } from '../../../../store';
import { isMultiSelect, noSelection } from '../../ToolbarButtons/utils';

interface Props {
    selectedBrowserItems: { rootShareId: string }[];
}

export const RemoveMeButton = ({ selectedBrowserItems }: Props) => {
    const { removeMe } = useSharedWithMeActions();
    const [confirmModal, showConfirmModal] = useConfirmActionModal();

    if (noSelection(selectedBrowserItems) || isMultiSelect(selectedBrowserItems)) {
        return null;
    }

    return (
        <>
            <ToolbarButton
                title={c('Action').t`Remove me`}
                icon={<Icon name="cross-big" alt={c('Action').t`Remove me`} />}
                onClick={() =>
                    removeMe(new AbortController().signal, showConfirmModal, selectedBrowserItems[0].rootShareId)
                }
                data-testid="toolbar-shared-with-me-leave"
            />
            {confirmModal}
        </>
    );
};
