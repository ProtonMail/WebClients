import { c } from 'ttag';
import { useLocation } from 'react-router-dom';
import { Vr } from '@proton/atoms';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { Icon, DropdownMenu, DropdownMenuButton, useLoading } from '@proton/components';
import ToolbarDropdown from './ToolbarDropdown';
import { useEmptyLabel } from '../../hooks/useEmptyLabel';
import { useMoveAll } from '../../hooks/useMoveAll';
import { labelIncludes } from '../../helpers/labels';
import { isSearch } from '../../helpers/elements';
import { extractSearchParameters } from '../../helpers/mailboxUrl';
import { Breakpoints } from '../../models/utils';

const { DRAFTS, ALL_DRAFTS, ALL_MAIL, INBOX, SENT, ALL_SENT, ARCHIVE, STARRED, SCHEDULED, TRASH } = MAILBOX_LABEL_IDS;

interface Props {
    breakpoints: Breakpoints;
    labelID: string;
    elementIDs: string[];
    selectedIDs: string[];
}

const MoreDropdown = ({ breakpoints, labelID = '', elementIDs = [], selectedIDs = [] }: Props) => {
    const [loading, withLoading] = useLoading();
    const { emptyLabel, modal: deleteAllModal } = useEmptyLabel();
    const { moveAll, modal: moveAllModal } = useMoveAll();
    const location = useLocation();
    const searchParameters = extractSearchParameters(location);

    if (!breakpoints.isNarrow) {
        return null;
    }

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

    const cannotMoveAll = labelIncludes(labelID, TRASH);

    if (cannotEmpty && cannotMoveAll) {
        return null;
    }

    const handleEmptyLabel = () => withLoading(emptyLabel(labelID));

    const handleMoveAll = () => moveAll(labelID);

    return (
        <>
            <Vr />
            <ToolbarDropdown
                title={c('Action').t`More`}
                content={<Icon className="toolbar-icon" name="three-dots-horizontal" />}
                data-testid="toolbar:more-dropdown"
                hasCaret={false}
            >
                {() => (
                    <DropdownMenu>
                        {!cannotEmpty && (
                            <DropdownMenuButton
                                data-testid="toolbar:empty"
                                loading={loading}
                                disabled={!elementIDs.length || !!selectedIDs.length || isSearch(searchParameters)}
                                className="text-left color-danger"
                                onClick={handleEmptyLabel}
                            >
                                {c('Action').t`Delete all`}
                            </DropdownMenuButton>
                        )}
                        {!cannotMoveAll && (
                            <DropdownMenuButton
                                data-testid="toolbar:moveAll"
                                loading={loading}
                                disabled={!elementIDs.length || !!selectedIDs.length || isSearch(searchParameters)}
                                className="text-left"
                                onClick={handleMoveAll}
                            >
                                {c('Action').t`Trash all`}
                            </DropdownMenuButton>
                        )}
                    </DropdownMenu>
                )}
            </ToolbarDropdown>
            {deleteAllModal}
            {moveAllModal}
        </>
    );
};

export default MoreDropdown;
