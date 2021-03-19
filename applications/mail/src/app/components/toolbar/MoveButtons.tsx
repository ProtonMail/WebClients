import React, { ReactNode } from 'react';
import { c } from 'ttag';
import { Icon, useLoading, useMailSettings, ToolbarButton } from 'react-components';
import { MAILBOX_LABEL_IDS } from 'proton-shared/lib/constants';
import { Label } from 'proton-shared/lib/interfaces/Label';
import { Folder } from 'proton-shared/lib/interfaces/Folder';

import { Breakpoints } from '../../models/utils';
import { getFolderName, isCustomFolder, isCustomLabel } from '../../helpers/labels';
import { useMoveToFolder } from '../../hooks/useApplyLabels';
import { useGetElementsFromIDs } from '../../hooks/mailbox/useElementsCache';
import DeleteButton from './DeleteButton';

const { TRASH, SPAM, DRAFTS, ARCHIVE, SENT, INBOX, ALL_DRAFTS, ALL_SENT, STARRED, ALL_MAIL } = MAILBOX_LABEL_IDS;

interface Props {
    labelID: string;
    elementID: string | undefined;
    labels?: Label[];
    folders?: Folder[];
    breakpoints: Breakpoints;
    selectedIDs: string[];
    onBack: () => void;
}

const MoveButtons = ({
    labelID = '',
    elementID,
    labels = [],
    folders = [],
    breakpoints,
    selectedIDs = [],
    onBack,
}: Props) => {
    const [loading, withLoading] = useLoading();
    const moveToFolder = useMoveToFolder();
    const labelIDs = labels.map(({ ID }) => ID);
    const getElementsFromIDs = useGetElementsFromIDs();
    const [{ Shortcuts } = { Shortcuts: 0 }] = useMailSettings();

    const handleMove = async (LabelID: string) => {
        const folderName = getFolderName(LabelID, folders);
        const fromLabelID = labelIDs.includes(labelID) ? INBOX : labelID;
        const elements = getElementsFromIDs(selectedIDs);
        await moveToFolder(elements, LabelID, folderName, fromLabelID);
        if (selectedIDs.includes(elementID || '')) {
            onBack();
        }
    };

    const titleInbox = Shortcuts ? (
        <>
            {c('Action').t`Move to inbox`}
            <br />
            <kbd className="bg-global-altgrey no-border">I</kbd>
        </>
    ) : (
        c('Action').t`Move to inbox`
    );

    const inboxButton = (
        <ToolbarButton
            key="inbox"
            title={titleInbox}
            onClick={() => withLoading(handleMove(INBOX))}
            disabled={loading || !selectedIDs.length}
            data-test-id="toolbar:movetoinbox"
            icon={<Icon name="inbox" alt={c('Action').t`Move to inbox`} />}
        />
    );

    const titleArchive = Shortcuts ? (
        <>
            {c('Action').t`Move to archive`}
            <br />
            <kbd className="bg-global-altgrey no-border">A</kbd>
        </>
    ) : (
        c('Action').t`Move to archive`
    );

    const archiveButton = (
        <ToolbarButton
            key="archive"
            title={titleArchive}
            onClick={() => withLoading(handleMove(ARCHIVE))}
            disabled={!selectedIDs.length}
            data-test-id="toolbar:movetoarchive"
            icon={<Icon name="archive" alt={c('Action').t`Move to archive`} />}
        />
    );

    const titleSpam = Shortcuts ? (
        <>
            {c('Action').t`Move to spam`}
            <br />
            <kbd className="bg-global-altgrey no-border">S</kbd>
        </>
    ) : (
        c('Action').t`Move to spam`
    );

    const spamButton = (
        <ToolbarButton
            key="spam"
            title={titleSpam}
            onClick={() => withLoading(handleMove(SPAM))}
            disabled={loading || !selectedIDs.length}
            data-test-id="toolbar:movetospam"
            icon={<Icon name="spam" alt={c('Action').t`Move to spam`} />}
        />
    );

    const titleNoSpam = Shortcuts ? (
        <>
            {c('Action').t`Move to inbox (not spam)`}
            <br />
            <kbd className="bg-global-altgrey no-border">I</kbd>
        </>
    ) : (
        c('Action').t`Move to inbox (not spam)`
    );

    const nospamButton = (
        <ToolbarButton
            key="nospam"
            title={titleNoSpam}
            onClick={() => withLoading(handleMove(INBOX))}
            disabled={loading || !selectedIDs.length}
            data-test-id="toolbar:movetonospam"
            icon={<Icon name="nospam" alt={c('Action').t`Move to inbox (not spam)`} />}
        />
    );

    const titleTrash = Shortcuts ? (
        <>
            {c('Action').t`Move to trash`}
            <br />
            <kbd className="bg-global-altgrey no-border">T</kbd>
        </>
    ) : (
        c('Action').t`Move to trash`
    );

    const trashButton = (
        <ToolbarButton
            key="trash"
            title={titleTrash}
            onClick={() => withLoading(handleMove(TRASH))}
            disabled={loading || !selectedIDs.length}
            data-test-id="toolbar:movetotrash"
            icon={<Icon name="trash" alt={c('Action').t`Move to trash`} />}
        />
    );

    const deleteButton = <DeleteButton key="delete" labelID={labelID} selectedIDs={selectedIDs} />;

    let buttons: ReactNode[] = [];

    // Should cover all situations, fallback on no buttons
    if (breakpoints.isNarrow) {
        if (labelID === SPAM || labelID === TRASH) {
            buttons = [deleteButton];
        } else {
            buttons = [trashButton];
        }
    } else if (labelID === INBOX) {
        buttons = [trashButton, archiveButton, spamButton];
    } else if (labelID === DRAFTS || labelID === ALL_DRAFTS) {
        buttons = [trashButton, archiveButton, deleteButton];
    } else if (labelID === SENT || labelID === ALL_SENT) {
        buttons = [trashButton, archiveButton, deleteButton];
    } else if (labelID === STARRED) {
        //
        buttons = [trashButton, archiveButton, spamButton];
    } else if (labelID === ARCHIVE) {
        buttons = [trashButton, inboxButton, spamButton];
    } else if (labelID === SPAM) {
        buttons = [trashButton, nospamButton, deleteButton];
    } else if (labelID === TRASH) {
        buttons = [inboxButton, archiveButton, deleteButton];
    } else if (labelID === ALL_MAIL) {
        buttons = [trashButton, archiveButton, spamButton];
    } else if (isCustomFolder(labelID, folders)) {
        buttons = [trashButton, archiveButton, spamButton];
    } else if (isCustomLabel(labelID, labels)) {
        buttons = [trashButton, archiveButton, spamButton];
    }

    return <>{buttons}</>; // TS limitation
};

export default MoveButtons;
