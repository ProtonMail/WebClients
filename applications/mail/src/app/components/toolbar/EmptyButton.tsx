import { c } from 'ttag';

import { Kbd, Vr } from '@proton/atoms';
import { Icon, ToolbarButton, useLabels, useMailSettings } from '@proton/components';
import { useLoading } from '@proton/hooks';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { metaKey, shiftKey } from '@proton/shared/lib/helpers/browser';

import { isCustomLabel, labelIncludes } from '../../helpers/labels';
import { useEmptyLabel } from '../../hooks/actions/useEmptyLabel';
import { Breakpoints } from '../../models/utils';

const { DRAFTS, ALL_DRAFTS, ALL_MAIL, INBOX, SENT, ALL_SENT, ARCHIVE, STARRED, TRASH, SPAM } = MAILBOX_LABEL_IDS;

interface Props {
    labelID: string;
    breakpoints: Breakpoints;
    elementIDs: string[];
}

const EmptyButton = ({ labelID = '', breakpoints, elementIDs }: Props) => {
    const [loading, withLoading] = useLoading();
    const [labels = []] = useLabels();
    const { emptyLabel, modal: deleteAllModal } = useEmptyLabel();
    const [{ Shortcuts = 0 } = {}] = useMailSettings();

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
            <Kbd shortcut={metaKey} /> + <Kbd shortcut={shiftKey} /> + <Kbd shortcut="Backspace" />
        </>
    ) : (
        title
    );

    return (
        <>
            <Vr />
            <ToolbarButton
                disabled={loading || !elementIDs.length}
                title={titleEmpty}
                onClick={handleClick}
                data-testid="toolbar:empty-folder"
                icon={<Icon name="broom" alt={title} />}
            />
            {deleteAllModal}
        </>
    );
};

export default EmptyButton;
