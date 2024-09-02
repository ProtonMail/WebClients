import { c } from 'ttag';

import { Icon, ToolbarButton } from '@proton/components';

import { useBookmarksActions } from '../../../../store';
import { isMultiSelect, noSelection } from '../../ToolbarButtons/utils';

interface Props {
    selectedBrowserItems: { bookmarkDetails?: { token: string; urlPassword: string } }[];
}

export const OpenBookmarkButton = ({ selectedBrowserItems }: Props) => {
    const { openBookmark } = useBookmarksActions();
    if (noSelection(selectedBrowserItems) || isMultiSelect(selectedBrowserItems)) {
        return null;
    }
    const { bookmarkDetails } = selectedBrowserItems[0];
    if (!bookmarkDetails) {
        return null;
    }

    return (
        <ToolbarButton
            title={c('Action').t`Open`}
            icon={<Icon name="arrow-out-square" alt={c('Action').t`Open`} />}
            onClick={() =>
                openBookmark({
                    token: bookmarkDetails.token,
                    urlPassword: bookmarkDetails.urlPassword,
                })
            }
            data-testid="toolbar-open-bookmark"
        />
    );
};
