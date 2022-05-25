import { c } from 'ttag';
import { ToolbarSeparator, useLoading, ToolbarButton } from '@proton/components';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { useLocation } from 'react-router-dom';
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

const AllActions = ({ labelID = '', elementIDs = [], selectedIDs = [] }: Props) => {
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

    if (cannotEmpty) {
        return null;
    }

    const handleEmptyLabel = () => withLoading(emptyLabel(labelID));

    return (
        <>
            <ToolbarSeparator />
            <ToolbarButton
                data-testid="toolbar:empty"
                disabled={loading || !elementIDs.length || !!selectedIDs.length || isSearch(searchParameters)}
                className="text-left color-danger flex-align-items-center"
                onClick={handleEmptyLabel}
            >
                {c('Action').t`Delete all`}
            </ToolbarButton>
            {deleteAllModal}
        </>
    );
};

export default AllActions;
