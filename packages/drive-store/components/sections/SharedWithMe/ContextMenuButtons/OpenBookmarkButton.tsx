import { c } from 'ttag';

import { useBookmarksActions } from '../../../../store';
import { ContextMenuButton } from '../../ContextMenu';

interface Props {
    token: string;
    urlPassword: string;
    close: () => void;
}

export const OpenBookmarkButton = ({ token, urlPassword, close }: Props) => {
    const { openBookmark } = useBookmarksActions();

    return (
        <ContextMenuButton
            name={c('Action').t`Open`}
            icon="arrow-out-square"
            testId="context-menu-open-bookmark"
            action={() => openBookmark({ token, urlPassword })}
            close={close}
        />
    );
};
