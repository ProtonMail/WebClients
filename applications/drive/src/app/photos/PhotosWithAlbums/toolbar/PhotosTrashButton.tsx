import { c } from 'ttag';

import { Icon, ToolbarButton } from '@proton/components';
import { useLoading } from '@proton/hooks';

import type { LinkInfo } from '../../../store';
import { useActions } from '../../../store';

interface Props {
    selectedLinks: LinkInfo[];
}

const PhotosTrashButton = ({ selectedLinks }: Props) => {
    const [isLoading, withLoading] = useLoading();
    const { trashLinks } = useActions();

    return (
        <ToolbarButton
            disabled={isLoading}
            title={c('Action').t`Delete`}
            onClick={() => withLoading(trashLinks(new AbortController().signal, selectedLinks))}
            data-testid="toolbar-trash"
            className="inline-flex flex-nowrap flex-row items-center"
        >
            <Icon name="trash" className="mr-2" /> {c('Action').t`Delete`}
        </ToolbarButton>
    );
};

export default PhotosTrashButton;
