import { c } from 'ttag';

import { Kbd } from '@proton/atoms/Kbd/Kbd';
import { Vr } from '@proton/atoms/Vr/Vr';
import { ToolbarButton, useActiveBreakpoint } from '@proton/components';
import { useLoading } from '@proton/hooks';
import { IcBroom } from '@proton/icons/icons/IcBroom';
import { useLabels } from '@proton/mail/store/labels/hooks';
import { isCustomLabel, labelIncludes } from '@proton/mail/helpers/location';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { metaKey, shiftKey } from '@proton/shared/lib/helpers/browser';

import { useEmptyLabel } from '../../hooks/actions/useEmptyLabel';

interface Props {
    labelID: string;
    elementIDs: string[];
}

const EmptyButton = ({ labelID = '', elementIDs }: Props) => {
    const breakpoints = useActiveBreakpoint();
    const [loading, withLoading] = useLoading();
    const [labels = []] = useLabels();
    const { emptyLabel, modal: deleteAllModal } = useEmptyLabel();
    const [{ Shortcuts }] = useMailSettings();

    const displayEmpty =
        !breakpoints.viewportWidth['<=small'] &&
        !labelIncludes(
            labelID,
            MAILBOX_LABEL_IDS.INBOX,
            MAILBOX_LABEL_IDS.DRAFTS,
            MAILBOX_LABEL_IDS.ALL_DRAFTS,
            MAILBOX_LABEL_IDS.STARRED,
            MAILBOX_LABEL_IDS.SENT,
            MAILBOX_LABEL_IDS.ALL_SENT,
            MAILBOX_LABEL_IDS.ARCHIVE,
            MAILBOX_LABEL_IDS.ALL_MAIL,
            MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL
        );

    if (!displayEmpty) {
        return null;
    }

    const handleClick = () => withLoading(emptyLabel(labelID));

    const isLabel = isCustomLabel(labelID, labels);
    let title;
    if (labelID === MAILBOX_LABEL_IDS.TRASH) {
        title = c('Action').t`Empty trash`;
    } else if (labelID === MAILBOX_LABEL_IDS.SPAM) {
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
                icon={<IcBroom alt={title} />}
            />
            {deleteAllModal}
        </>
    );
};

export default EmptyButton;
