import { c } from 'ttag';

import { ToolbarButton } from '@proton/components';
import { IcArrowOutSquare } from '@proton/icons/icons/IcArrowOutSquare';

import { ContextMenuButton } from '../../../statelessComponents/ContextMenu';
import { useBookmarksActions } from '../hooks/useBookmarksActions';

interface BaseProps {
    url: string;
}

interface ContextMenuProps extends BaseProps {
    buttonType: 'contextMenu';
    close: () => void;
}

interface ToolbarProps extends BaseProps {
    buttonType: 'toolbar';
    close?: never;
}

type Props = ContextMenuProps | ToolbarProps;

export const OpenBookmarkButton = ({ url, close, buttonType }: Props) => {
    const { openBookmark } = useBookmarksActions();
    const title = c('Action').t`Open`;

    const handleOpen = () => openBookmark(url);

    if (buttonType === 'toolbar') {
        return (
            <ToolbarButton
                title={title}
                icon={<IcArrowOutSquare alt={title} />}
                onClick={handleOpen}
                data-testid="toolbar-open-bookmark"
            />
        );
    }

    return (
        <ContextMenuButton
            icon={<IcArrowOutSquare />}
            name={title}
            action={handleOpen}
            close={close}
            testId="context-menu-open-bookmark"
        />
    );
};
