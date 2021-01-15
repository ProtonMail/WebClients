import React, { ReactNode } from 'react';
import { c } from 'ttag';
import { Icon, useLoading, useMailSettings } from 'react-components';
import { MAILBOX_LABEL_IDS } from 'proton-shared/lib/constants';
import { Label } from 'proton-shared/lib/interfaces/Label';
import { Folder } from 'proton-shared/lib/interfaces/Folder';

import ToolbarButton from './ToolbarButton';
import { Breakpoints } from '../../models/utils';
import { getFolderName, isCustomFolder, isCustomLabel } from '../../helpers/labels';
import { useMoveToFolder } from '../../hooks/useApplyLabels';
import { useGetElementsFromIDs } from '../../hooks/mailbox/useElementsCache';
import DeleteButton from './DeleteButton';

const { TRASH, SPAM, DRAFTS, ARCHIVE, SENT, INBOX, ALL_DRAFTS, ALL_SENT, STARRED, ALL_MAIL } = MAILBOX_LABEL_IDS;

interface Props {
    labelID: string;
    labels?: Label[];
    folders?: Folder[];
    breakpoints: Breakpoints;
    selectedIDs: string[];
    onBack: () => void;
}

const MoveButtons = ({ labelID = '', labels = [], folders = [], breakpoints, selectedIDs = [], onBack }: Props) => {
    const [loading, withLoading] = useLoading();
    const moveToFolder = useMoveToFolder();
    const labelIDs = labels.map(({ ID }) => ID);
    const getElementsFromIDs = useGetElementsFromIDs();
    const [{ Hotkeys } = { Hotkeys: 0 }] = useMailSettings();

    const handleMove = async (LabelID: string) => {
        const folderName = getFolderName(LabelID, folders);
        const fromLabelID = labelIDs.includes(labelID) ? INBOX : labelID;
        const elements = getElementsFromIDs(selectedIDs);
        await moveToFolder(elements, LabelID, folderName, fromLabelID);
        onBack();
    };

    const titleInbox = Hotkeys ? (
        <>
            {c('Action').t`Move to inbox`}
            <br />
            <kbd className="bg-global-altgrey noborder">I</kbd>
        </>
    ) : (
        c('Action').t`Move to inbox`
    );

    const inboxButton = (
        <ToolbarButton
            key="inbox"
            loading={loading}
            title={titleInbox}
            onClick={() => withLoading(handleMove(INBOX))}
            disabled={!selectedIDs.length}
            data-test-id="toolbar:movetoinbox"
        >
            <Icon className="toolbar-icon mauto" name="inbox" />
            <span className="sr-only">{c('Action').t`Move to inbox`}</span>
        </ToolbarButton>
    );

    const titleArchive = Hotkeys ? (
        <>
            {c('Action').t`Move to archive`}
            <br />
            <kbd className="bg-global-altgrey noborder">A</kbd>
        </>
    ) : (
        c('Action').t`Move to archive`
    );

    const archiveButton = (
        <ToolbarButton
            key="archive"
            loading={loading}
            title={titleArchive}
            onClick={() => withLoading(handleMove(ARCHIVE))}
            disabled={!selectedIDs.length}
            data-test-id="toolbar:movetoarchive"
        >
            <Icon className="toolbar-icon mauto" name="archive" />
            <span className="sr-only">{c('Action').t`Move to archive`}</span>
        </ToolbarButton>
    );

    const titleSpam = Hotkeys ? (
        <>
            {c('Action').t`Move to spam`}
            <br />
            <kbd className="bg-global-altgrey noborder">S</kbd>
        </>
    ) : (
        c('Action').t`Move to spam`
    );

    const spamButton = (
        <ToolbarButton
            key="spam"
            loading={loading}
            title={titleSpam}
            onClick={() => withLoading(handleMove(SPAM))}
            disabled={!selectedIDs.length}
            data-test-id="toolbar:movetospam"
        >
            <Icon className="toolbar-icon mauto" name="spam" />
            <span className="sr-only">{c('Action').t`Move to spam`}</span>
        </ToolbarButton>
    );

    const titleNoSpam = Hotkeys ? (
        <>
            {c('Action').t`Move to inbox (not spam)`}
            <br />
            <kbd className="bg-global-altgrey noborder">I</kbd>
        </>
    ) : (
        c('Action').t`Move to inbox (not spam)`
    );

    const nospamButton = (
        <ToolbarButton
            key="nospam"
            loading={loading}
            title={titleNoSpam}
            onClick={() => withLoading(handleMove(INBOX))}
            disabled={!selectedIDs.length}
            data-test-id="toolbar:movetonospam"
        >
            <Icon className="toolbar-icon mauto" name="nospam" />
            <span className="sr-only">{c('Action').t`Move to inbox (not spam)`}</span>
        </ToolbarButton>
    );

    const titleTrash = Hotkeys ? (
        <>
            {c('Action').t`Move to trash`}
            <br />
            <kbd className="bg-global-altgrey noborder">T</kbd>
        </>
    ) : (
        c('Action').t`Move to trash`
    );

    const trashButton = (
        <ToolbarButton
            key="trash"
            loading={loading}
            title={titleTrash}
            onClick={() => withLoading(handleMove(TRASH))}
            disabled={!selectedIDs.length}
            data-test-id="toolbar:movetotrash"
        >
            <Icon className="toolbar-icon mauto" name="trash" />
            <span className="sr-only">{c('Action').t`Move to trash`}</span>
        </ToolbarButton>
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
