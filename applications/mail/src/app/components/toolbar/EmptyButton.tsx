import React from 'react';
import { Icon, useLoading, useLabels } from 'react-components';
import { MAILBOX_LABEL_IDS } from 'proton-shared/lib/constants';
import { c } from 'ttag';

import ToolbarButton from './ToolbarButton';
import ToolbarSeparator from './ToolbarSeparator';
import { Breakpoints } from '../../models/utils';
import { labelIncludes, isCustomLabel } from '../../helpers/labels';
import { useEmptyLabel } from '../../hooks/useEmptyLabel';

const { DRAFTS, ALL_DRAFTS, ALL_MAIL, INBOX, SENT, ALL_SENT, ARCHIVE, STARRED, TRASH, SPAM } = MAILBOX_LABEL_IDS;

interface Props {
    labelID: string;
    breakpoints: Breakpoints;
    elementIDs: string[];
}

const EmptyButton = ({ labelID = '', breakpoints, elementIDs }: Props) => {
    const [loading, withLoading] = useLoading();
    const [labels = []] = useLabels();
    const emptyLabel = useEmptyLabel();

    const displayEmpty =
        !breakpoints.isNarrow &&
        !labelIncludes(labelID, INBOX, DRAFTS, ALL_DRAFTS, STARRED, SENT, ALL_SENT, ARCHIVE, ALL_MAIL);

    if (!displayEmpty) {
        return null;
    }

    const handleClick = () => withLoading(emptyLabel(labelID));

    const isLabel = isCustomLabel(labelID, labels);
    let title = '';
    if (labelID === TRASH) {
        title = c('Action').t`Empty trash`;
    } else if (labelID === SPAM) {
        title = c('Action').t`Empty spam`;
    } else if (isLabel) {
        title = c('Action').t`Empty label`;
    } else {
        title = c('Action').t`Empty folder`;
    }

    return (
        <>
            <ToolbarSeparator />
            <ToolbarButton
                disabled={!elementIDs.length}
                loading={loading}
                title={title}
                onClick={handleClick}
                data-test-id="toolbar:emptyfolder"
            >
                <Icon className="toolbar-icon mauto" name="empty-folder" alt={title} />
            </ToolbarButton>
        </>
    );
};

export default EmptyButton;
