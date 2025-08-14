import { c } from 'ttag';

import { Icon, ToolbarButton } from '@proton/components';

import { ContextMenuButton } from '../../../components/sections/ContextMenu';
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

    const handleOpen = () => openBookmark(url);

    if (buttonType === 'toolbar') {
        return (
            <ToolbarButton
                title={c('Action').t`Open`}
                icon={<Icon name="arrow-out-square" alt={c('Action').t`Open`} />}
                onClick={handleOpen}
                data-testid="toolbar-open-bookmark"
            />
        );
    }

    return (
        <ContextMenuButton
            icon="arrow-out-square"
            name={c('Action').t`Open`}
            action={handleOpen}
            close={close}
            testId="context-menu-open-bookmark"
        />
    );
};
