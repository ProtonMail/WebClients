import React from 'react';
import { Icon, useLoading, useLabels, useMailSettings, ToolbarButton, ToolbarSeparator } from 'react-components';
import { MAILBOX_LABEL_IDS } from 'proton-shared/lib/constants';
import { metaKey, shiftKey } from 'proton-shared/lib/helpers/browser';
import { c } from 'ttag';

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
    const [{ Shortcuts } = { Shortcuts: 0 }] = useMailSettings();

    const displayEmpty =
        !breakpoints.isNarrow &&
        !labelIncludes(labelID, INBOX, DRAFTS, ALL_DRAFTS, STARRED, SENT, ALL_SENT, ARCHIVE, ALL_MAIL);

    if (!displayEmpty) {
        return null;
    }

    const handleClick = () => withLoading(emptyLabel(labelID));

    const isLabel = isCustomLabel(labelID, labels);
    let title;
    if (labelID === TRASH) {
        title = c('Action').t`Empty trash`;
    } else if (labelID === SPAM) {
        title = c('Action').t`Empty spam`;
    } else if (isLabel) {
        title = c('Action').t`Empty label`;
    } else {
        title = c('Action').t`Empty folder`;
    }

    const titleEmpty = Shortcuts ? (
        <>
            {title}
            <br />
            <kbd className="bg-global-altgrey no-border">{metaKey}</kbd> +{' '}
            <kbd className="bg-global-altgrey no-border">{shiftKey}</kbd> +{' '}
            <kbd className="bg-global-altgrey no-border">Backspace</kbd>
        </>
    ) : (
        title
    );

    return (
        <>
            <ToolbarSeparator />
            <ToolbarButton
                disabled={loading || !elementIDs.length}
                title={titleEmpty}
                onClick={handleClick}
                data-test-id="toolbar:emptyfolder"
                icon={<Icon name="empty-folder" alt={title} />}
            />
        </>
    );
};

export default EmptyButton;
