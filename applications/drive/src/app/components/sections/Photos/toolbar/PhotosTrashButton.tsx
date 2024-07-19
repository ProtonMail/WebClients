import { c } from 'ttag';

import { Icon, ToolbarButton } from '@proton/components';
import { useLoading } from '@proton/hooks';

import type { LinkInfo } from '../../../../store';
import { useActions } from '../../../../store';

interface Props {
    selectedLinks: LinkInfo[];
}

const PhotosTrashButton = ({ selectedLinks }: Props) => {
    const [isLoading, withLoading] = useLoading();
    const { trashLinks } = useActions();

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

export default PhotosTrashButton;
