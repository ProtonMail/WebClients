import { c } from 'ttag';

import { ToolbarButton } from '@proton/components';
import { useLoading } from '@proton/hooks';
import { IcTrash } from '@proton/icons/icons/IcTrash';

import type { DecryptedLink, useActions } from '../../../../store';

interface MoveToTrashButtonProps {
    selectedLinks: DecryptedLink[];
    trashLinks: ReturnType<typeof useActions>['trashLinks'];
}

const MoveToTrashButton = ({ selectedLinks, trashLinks }: MoveToTrashButtonProps) => {
    const [isLoading, withLoading] = useLoading();

    return (
        <ToolbarButton
            disabled={isLoading}
            title={c('Action').t`Move to trash`}
            icon={<IcTrash alt={c('Action').t`Move to trash`} />}
            onClick={() => withLoading(trashLinks(new AbortController().signal, selectedLinks))}
            data-testid="toolbar-trash"
        />
    );
};

export default MoveToTrashButton;
