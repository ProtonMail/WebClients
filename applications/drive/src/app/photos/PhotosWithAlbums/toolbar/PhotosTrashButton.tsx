import { c } from 'ttag';

import { DropdownMenuButton, Icon, ToolbarButton } from '@proton/components';
import { useLoading } from '@proton/hooks';
import clsx from '@proton/utils/clsx';

import type { LinkInfo } from '../../../store';
import { useActions } from '../../../store';

interface Props {
    selectedLinks: LinkInfo[];
    showIconOnly: boolean;
    dropDownMenuButton?: boolean;
}

const PhotosTrashButton = ({ selectedLinks, showIconOnly, dropDownMenuButton }: Props) => {
    const [isLoading, withLoading] = useLoading();
    const { trashLinks } = useActions();
    const ButtonComp = dropDownMenuButton ? DropdownMenuButton : ToolbarButton;
    return (
        <ButtonComp
            disabled={isLoading}
            title={c('Action').t`Delete`}
            onClick={() => withLoading(trashLinks(new AbortController().signal, selectedLinks))}
            data-testid="toolbar-trash"
            className="inline-flex flex-nowrap flex-row items-center"
        >
            <Icon name="trash" className={clsx(!showIconOnly && 'mr-2')} />
            <span className={clsx(showIconOnly && 'sr-only')}>{c('Action').t`Delete`}</span>
        </ButtonComp>
    );
};

export default PhotosTrashButton;
