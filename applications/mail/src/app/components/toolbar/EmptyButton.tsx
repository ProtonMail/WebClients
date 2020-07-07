import React from 'react';
import { Icon, useLoading } from 'react-components';
import { MAILBOX_LABEL_IDS } from 'proton-shared/lib/constants';
import { c } from 'ttag';

import ToolbarButton from './ToolbarButton';
import ToolbarSeparator from './ToolbarSeparator';
import { Breakpoints } from '../../models/utils';
import { labelIncludes } from '../../helpers/labels';
import { Element } from '../../models/element';
import { useEmptyLabel } from '../../hooks/useEmptyLabel';

const { DRAFTS, ALL_DRAFTS, ALL_MAIL, INBOX, SENT, ALL_SENT, ARCHIVE, STARRED } = MAILBOX_LABEL_IDS;

interface Props {
    labelID: string;
    breakpoints: Breakpoints;
    elements: Element[];
}

const EmptyButton = ({ labelID = '', breakpoints, elements }: Props) => {
    const [loading, withLoading] = useLoading();
    const emptyLabel = useEmptyLabel();

    const displayEmpty =
        !breakpoints.isNarrow &&
        !labelIncludes(labelID, INBOX, DRAFTS, ALL_DRAFTS, STARRED, SENT, ALL_SENT, ARCHIVE, ALL_MAIL);

    const handleClick = () => withLoading(emptyLabel(labelID));

    if (!displayEmpty) {
        return null;
    }

    return (
        <>
            <ToolbarSeparator />
            <ToolbarButton
                disabled={!elements.length}
                loading={loading}
                title={c('Action').t`Empty folder`}
                onClick={handleClick}
                data-cy="emptyfolder"
            >
                <Icon className="toolbar-icon mauto" name="empty-folder" />
            </ToolbarButton>
        </>
    );
};

export default EmptyButton;
