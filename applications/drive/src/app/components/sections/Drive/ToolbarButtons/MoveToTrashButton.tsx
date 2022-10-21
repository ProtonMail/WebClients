import { c } from 'ttag';

import { Icon, ToolbarButton, useLoading } from '@proton/components';

import { DecryptedLink, useActions } from '../../../../store';

interface Props {
    selectedLinks: DecryptedLink[];
}

const MoveToTrashButton = ({ selectedLinks }: Props) => {
    const [isLoading, withLoading] = useLoading();
    const { trashLinks } = useActions();

    return (
        <ToolbarButton
            disabled={isLoading}
            title={c('Action').t`Move to trash`}
            icon={<Icon name="trash" />}
            onClick={() => withLoading(trashLinks(new AbortController().signal, selectedLinks))}
            data-testid="toolbar-trash"
        />
    );
};

export default MoveToTrashButton;
