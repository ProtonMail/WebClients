import { c } from 'ttag';

import { Icon, ToolbarButton } from '@proton/components';
import { useLoading } from '@proton/hooks';

import { DecryptedLink, useActions } from '../../../../store';

interface Props {
    selectedLinks: DecryptedLink[];
    onTrash?: (linkIds: string[]) => void;
}

const MoveToTrashButton = ({ selectedLinks, onTrash }: Props) => {
    const [isLoading, withLoading] = useLoading();
    const { trashLinks } = useActions();

    return (
        <ToolbarButton
            disabled={isLoading}
            title={c('Action').t`Move to trash`}
            icon={<Icon name="trash" alt={c('Action').t`Move to trash`} />}
            onClick={() =>
                withLoading(
                    trashLinks(new AbortController().signal, selectedLinks).then((result) => {
                        if (onTrash && result) {
                            onTrash(result.successes);
                        }
                    })
                )
            }
            data-testid="toolbar-trash"
        />
    );
};

export default MoveToTrashButton;
