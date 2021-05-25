import React from 'react';
import { c } from 'ttag';
import { Icon, DropdownMenu, DropdownMenuButton, ToolbarSeparator, useLoading, useLabels } from 'react-components';
import { MAILBOX_LABEL_IDS } from 'proton-shared/lib/constants';

import ToolbarDropdown from './ToolbarDropdown';
import { useEmptyLabel } from '../../hooks/useEmptyLabel';
import { labelIncludes, isCustomLabel } from '../../helpers/labels';

const { DRAFTS, ALL_DRAFTS, ALL_MAIL, INBOX, SENT, ALL_SENT, ARCHIVE, STARRED } = MAILBOX_LABEL_IDS;

interface Props {
    labelID: string;
    elementIDs: string[];
    selectedIDs: string[];
}

const MoreDropdown = ({ labelID = '', elementIDs = [], selectedIDs = [] }: Props) => {
    const [loading, withLoading] = useLoading();
    const [labels = []] = useLabels();
    const emptyLabel = useEmptyLabel();
    const cannotEmpty =
        isCustomLabel(labelID, labels) ||
        labelIncludes(labelID, INBOX, DRAFTS, ALL_DRAFTS, STARRED, SENT, ALL_SENT, ARCHIVE, ALL_MAIL);

    if (cannotEmpty) {
        return null;
    }

    const handleEmptyLabel = () => withLoading(emptyLabel(labelID));

    return (
        <>
            <ToolbarDropdown
                title={c('Action').t`More`}
                content={<Icon className="toolbar-icon" name="3-dots-vertical" />}
                data-testid="toolbar:more-dropdown"
                hasCaret={false}
            >
                {() => (
                    <DropdownMenu>
                        <DropdownMenuButton
                            data-testid="toolbar:empty"
                            loading={loading}
                            disabled={!elementIDs.length || !!selectedIDs.length}
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
