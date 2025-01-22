import { c } from 'ttag';

import { Icon, ToolbarButton } from '@proton/components';
import { useLoading } from '@proton/hooks';

import type { DecryptedLink } from '../../../../store';
import type { useActions } from '../../../../store';

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
            icon={<Icon name="trash" alt={c('Action').t`Move to trash`} />}
            onClick={() => withLoading(trashLinks(new AbortController().signal, selectedLinks))}
            data-testid="toolbar-trash"
        />
    );
};

export default MoveToTrashButton;
