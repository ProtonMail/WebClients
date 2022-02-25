import { c } from 'ttag';
import { useLocation } from 'react-router-dom';

import { Vr } from '@proton/atoms';
import { Icon, DropdownMenu, DropdownMenuButton, useLoading } from '@proton/components';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';

import ToolbarDropdown from './ToolbarDropdown';
import { useEmptyLabel } from '../../hooks/useEmptyLabel';
import { labelIncludes } from '../../helpers/labels';
import { isSearch } from '../../helpers/elements';
import { extractSearchParameters } from '../../helpers/mailboxUrl';

const { DRAFTS, ALL_DRAFTS, ALL_MAIL, INBOX, SENT, ALL_SENT, ARCHIVE, STARRED, SCHEDULED, TRASH } = MAILBOX_LABEL_IDS;

interface Props {
    labelID: string;
    elementIDs: string[];
    selectedIDs: string[];
    handleMoveAll: (source: string, destination: string) => void;
}

const MoreDropdown = ({ labelID = '', elementIDs = [], selectedIDs = [], handleMoveAll }: Props) => {
    const [loading, withLoading] = useLoading();
    const { emptyLabel, modal: deleteAllModal } = useEmptyLabel();
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

    const cannotMoveAll = labelIncludes(labelID, TRASH);

    if (cannotEmpty && cannotMoveAll) {
        return null;
    }

    const handleEmptyLabel = () => withLoading(emptyLabel(labelID));

    return (
        <>
            <ToolbarDropdown
                title={c('Action').t`More`}
                content={<Icon className="toolbar-icon" name="three-dots-vertical" />}
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
                                onClick={() => handleMoveAll(labelID, TRASH)}
                            >
                                {c('Action').t`Trash all`}
                            </DropdownMenuButton>
                        )}
                    </DropdownMenu>
                )}
            </ToolbarDropdown>
            <Vr />
            {deleteAllModal}
        </>
    );
};

export default MoreDropdown;
