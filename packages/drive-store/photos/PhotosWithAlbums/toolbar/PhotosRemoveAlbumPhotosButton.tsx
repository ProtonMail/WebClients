import { c } from 'ttag';

import { CircleLoader } from '@proton/atoms';
import { DropdownMenuButton, Icon, ToolbarButton } from '@proton/components';
import useLoading from '@proton/hooks/useLoading';
import clsx from '@proton/utils/clsx';

export const PhotosRemoveAlbumPhotosButton = ({
    onClick,
    showIconOnly,
    dropDownMenuButton = false,
}: {
    onClick: () => Promise<void>;
    showIconOnly: boolean;
    dropDownMenuButton?: boolean;
}) => {
    const [isLoading, withLoading] = useLoading();
    const ButtonComp = dropDownMenuButton ? DropdownMenuButton : ToolbarButton;
    return (
        <ButtonComp
            className="inline-flex flex-nowrap flex-row items-center"
            disabled={isLoading}
            onClick={() => withLoading(onClick)}
            title={c('Action').t`Remove from album`}
            data-testid="toolbar-remove-album-photos"
        >
            {/* // TODO: We should update the toolbar component to prevent doing this everywhere */}
            {isLoading && <CircleLoader className={clsx(!showIconOnly && 'm-px mr-2')} />}
            {!isLoading && <Icon className={clsx(!showIconOnly && 'mr-2')} name="trash" />}
            <span className={clsx(showIconOnly && 'sr-only', isLoading && !showIconOnly && 'ml-px')}>{c('Action')
                .t`Remove from album`}</span>
        </ButtonComp>
    );
};
