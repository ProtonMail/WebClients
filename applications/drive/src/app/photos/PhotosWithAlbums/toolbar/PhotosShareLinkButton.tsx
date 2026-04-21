import { c } from 'ttag';

import { DropdownMenuButton, Icon, ToolbarButton } from '@proton/components';
import clsx from '@proton/utils/clsx';

import type { PhotoItem } from '../../usePhotos.store';

interface Props {
    selectedPhoto: PhotoItem | undefined;
    showIconOnly: boolean;
    dropDownMenuButton?: boolean;
    onClick: () => void;
}

const PhotosShareLinkButton = ({ selectedPhoto, showIconOnly, onClick, dropDownMenuButton = false }: Props) => {
    if (!selectedPhoto) {
        return null;
    }

    const ButtonComp = dropDownMenuButton ? DropdownMenuButton : ToolbarButton;

    return (
        <>
            <ButtonComp
                title={c('Action').t`Share`}
                onClick={() => onClick()}
                data-testid="toolbar-share-link"
                className="inline-flex flex-nowrap flex-row items-center"
            >
                <Icon name="user-plus" className={clsx(!showIconOnly && 'mr-2')} />
                <span className={clsx(showIconOnly && 'sr-only')}>{c('Action').t`Share`}</span>
            </ButtonComp>
        </>
    );
};

export default PhotosShareLinkButton;
