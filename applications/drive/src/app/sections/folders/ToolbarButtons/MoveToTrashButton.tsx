import { c } from 'ttag';

import { Icon, ToolbarButton } from '@proton/components';
import { useLoading } from '@proton/hooks';

import { useActions } from '../../../store';

type Item = {
    parentLinkId: string;
    linkId: string;
    rootShareId: string;
    volumeId: string;
    isFile: boolean;
};
interface MoveToTrashButtonProps {
    selectedItems: Item[];
}

export const MoveToTrashButton = ({ selectedItems }: MoveToTrashButtonProps) => {
    const [isLoading, withLoading] = useLoading();
    const { trashLinks } = useActions();

    return (
        <ToolbarButton
            disabled={isLoading}
            title={c('Action').t`Move to trash`}
            icon={<Icon name="trash" alt={c('Action').t`Move to trash`} />}
            onClick={() => withLoading(trashLinks(new AbortController().signal, selectedItems))}
            data-testid="toolbar-trash"
        />
    );
};
