import { c } from 'ttag';
import { Icon, DropdownMenu, DropdownMenuButton, ToolbarSeparator, useLoading } from '@proton/components';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';

import { useLocation } from 'react-router-dom';
import ToolbarDropdown from './ToolbarDropdown';
import { useEmptyLabel } from '../../hooks/useEmptyLabel';
import { labelIncludes } from '../../helpers/labels';
import { isSearch } from '../../helpers/elements';
import { extractSearchParameters } from '../../helpers/mailboxUrl';

const { DRAFTS, ALL_DRAFTS, ALL_MAIL, INBOX, SENT, ALL_SENT, ARCHIVE, STARRED, SCHEDULED } = MAILBOX_LABEL_IDS;

interface Props {
    labelID: string;
    elementIDs: string[];
    selectedIDs: string[];
}

const MoreDropdown = ({ labelID = '', elementIDs = [], selectedIDs = [] }: Props) => {
    const [loading, withLoading] = useLoading();
    const emptyLabel = useEmptyLabel();
    const location = useLocation();
    const searchParameters = extractSearchParameters(location);

    const cannotEmpty = labelIncludes(
        labelID,
        INBOX,
        DRAFTS,
        ALL_DRAFTS,
        STARRED,
        SENT,
        ALL_SENT,
        ARCHIVE,
        ALL_MAIL,
        SCHEDULED
    );

    if (cannotEmpty) {
        return null;
    }

    const handleEmptyLabel = () => withLoading(emptyLabel(labelID));

    return (
        <>
            <ToolbarDropdown
                title={c('Action').t`More`}
                content={<Icon className="toolbar-icon" name="ellipsis-vertical" />}
                data-testid="toolbar:more-dropdown"
                hasCaret={false}
            >
                {() => (
                    <DropdownMenu>
                        <DropdownMenuButton
                            data-testid="toolbar:empty"
                            loading={loading}
                            disabled={!elementIDs.length || !!selectedIDs.length || isSearch(searchParameters)}
                            className="text-left color-danger"
                            onClick={handleEmptyLabel}
                        >
                            {c('Action').t`Delete all`}
                        </DropdownMenuButton>
                    </DropdownMenu>
                )}
            </ToolbarDropdown>
            <ToolbarSeparator />
        </>
    );
};

export default MoreDropdown;
