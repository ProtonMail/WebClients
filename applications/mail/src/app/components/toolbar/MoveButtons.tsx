import React, { ReactNode } from 'react';
import { c } from 'ttag';
import { Icon, useLoading } from 'react-components';
import { MAILBOX_LABEL_IDS } from 'proton-shared/lib/constants';
import { Label } from 'proton-shared/lib/interfaces/Label';
import { Folder } from 'proton-shared/lib/interfaces/Folder';

import ToolbarButton from './ToolbarButton';
import { Breakpoints } from '../../models/utils';
import { getFolderName, isCustomFolder, isCustomLabel } from '../../helpers/labels';
import { useMoveToFolder } from '../../hooks/useApplyLabels';
import { useElementsCache } from '../../hooks/useElementsCache';
import DeleteButton from './DeleteButton';

const { TRASH, SPAM, DRAFTS, ARCHIVE, SENT, INBOX, ALL_DRAFTS, ALL_SENT, STARRED, ALL_MAIL } = MAILBOX_LABEL_IDS;

interface Props {
    labelID: string;
    labels?: Label[];
    folders?: Folder[];
    breakpoints: Breakpoints;
    selectedIDs: string[];
    onBack: () => void;
    conversationMode: boolean;
}

const MoveButtons = ({
    labelID = '',
    labels = [],
    folders = [],
    breakpoints,
    selectedIDs = [],
    onBack,
    conversationMode
}: Props) => {
    const [loading, withLoading] = useLoading();
    const moveToFolder = useMoveToFolder();
    const labelIDs = labels.map(({ ID }) => ID);
    const [elementsCache] = useElementsCache();

    const handleMove = async (LabelID: string) => {
        const folderName = getFolderName(LabelID, folders);
        const fromLabelID = labelIDs.includes(labelID) ? INBOX : labelID;
        const elements = selectedIDs.map((elementID) => elementsCache.elements[elementID]);
        await moveToFolder(elements, LabelID, folderName, fromLabelID);
        onBack();
    };

    const inboxButton = (
        <ToolbarButton
            key="inbox"
            loading={loading}
            title={c('Action').t`Move to inbox`}
            onClick={() => withLoading(handleMove(INBOX))}
            disabled={!selectedIDs.length}
            data-test-id="toolbar:movetoinbox"
        >
            <Icon className="toolbar-icon mauto" name="inbox" />
            <span className="sr-only">{c('Action').t`Move to inbox`}</span>
        </ToolbarButton>
    );

    const archiveButton = (
        <ToolbarButton
            key="archive"
            loading={loading}
            title={c('Action').t`Move to archive`}
            onClick={() => withLoading(handleMove(ARCHIVE))}
            disabled={!selectedIDs.length}
            data-test-id="toolbar:movetoarchive"
        >
            <Icon className="toolbar-icon mauto" name="archive" />
            <span className="sr-only">{c('Action').t`Move to archive`}</span>
        </ToolbarButton>
    );

    const spamButton = (
        <ToolbarButton
            key="spam"
            loading={loading}
            title={c('Action').t`Move to spam`}
            onClick={() => withLoading(handleMove(SPAM))}
            disabled={!selectedIDs.length}
            data-test-id="toolbar:movetospam"
        >
            <Icon className="toolbar-icon mauto" name="spam" />
            <span className="sr-only">{c('Action').t`Move to spam`}</span>
        </ToolbarButton>
    );

    const trashButton = (
        <ToolbarButton
            key="trash"
            loading={loading}
            title={c('Action').t`Move to trash`}
            onClick={() => withLoading(handleMove(TRASH))}
            disabled={!selectedIDs.length}
            data-test-id="toolbar:movetotrash"
        >
            <Icon className="toolbar-icon mauto" name="trash" />
            <span className="sr-only">{c('Action').t`Move to trash`}</span>
        </ToolbarButton>
    );

    const deleteButton = (
        <DeleteButton key="delete" labelID={labelID} conversationMode={conversationMode} selectedIDs={selectedIDs} />
    );

    let buttons: ReactNode[] = [];

    // Should cover all situations, fallback on no buttons
    if (breakpoints.isNarrow) {
        if (labelID === SPAM || labelID === TRASH) {
            buttons = [deleteButton];
        } else {
            buttons = [trashButton];
        }
    } else {
        if (labelID === INBOX) {
            buttons = [trashButton, archiveButton, spamButton];
        } else if (labelID === DRAFTS || labelID === ALL_DRAFTS) {
            buttons = [trashButton, archiveButton, deleteButton];
        } else if (labelID === SENT || labelID === ALL_SENT) {
            buttons = [trashButton, archiveButton, deleteButton];
        } else if (labelID === STARRED) {
            buttons = [inboxButton, trashButton, archiveButton];
        } else if (labelID === ARCHIVE) {
            buttons = [inboxButton, trashButton, spamButton];
        } else if (labelID === SPAM) {
            buttons = [inboxButton, trashButton, deleteButton];
        } else if (labelID === TRASH) {
            buttons = [inboxButton, archiveButton, deleteButton];
        } else if (labelID === ALL_MAIL) {
            buttons = [inboxButton, trashButton, archiveButton];
        } else if (isCustomFolder(labelID, folders)) {
            buttons = [inboxButton, trashButton, archiveButton];
        } else if (isCustomLabel(labelID, labels)) {
            buttons = [inboxButton, trashButton, archiveButton];
        }
    }

    return <>{buttons}</>; // TS limitation
};

export default MoveButtons;
