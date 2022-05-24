import { ReactNode } from 'react';
import { c } from 'ttag';
import { Icon, useLoading, useMailSettings, ToolbarButton, useLabels, useFolders } from '@proton/components';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { Vr } from '@proton/atoms';
import { Breakpoints } from '../../models/utils';
import { isCustomFolder, isCustomLabel } from '../../helpers/labels';
import DeleteButton from './DeleteButton';

const { TRASH, SPAM, DRAFTS, ARCHIVE, SENT, INBOX, ALL_DRAFTS, ALL_SENT, STARRED, ALL_MAIL, SCHEDULED } =
    MAILBOX_LABEL_IDS;

interface Props {
    labelID: string;
    breakpoints: Breakpoints;
    selectedIDs: string[];
    onMove: (labelID: string) => Promise<void>;
    onDelete: () => Promise<void>;
}

const MoveButtons = ({ labelID = '', breakpoints, selectedIDs = [], onMove, onDelete }: Props) => {
    const [{ Shortcuts = 0 } = {}] = useMailSettings();
    const [labels] = useLabels();
    const [folders] = useFolders();

    const [loading, withLoading] = useLoading();

    if (!selectedIDs.length) {
        return null;
    }

    const titleInbox = Shortcuts ? (
        <>
            {c('Action').t`Move to inbox`}
            <br />
            <kbd className="border-none">I</kbd>
        </>
    ) : (
        c('Action').t`Move to inbox`
    );

    const inboxButton = (
        <ToolbarButton
            key="inbox"
            title={titleInbox}
            onClick={() => withLoading(onMove(INBOX))}
            disabled={loading || !selectedIDs.length}
            data-testid="toolbar:movetoinbox"
            icon={<Icon name="inbox" alt={c('Action').t`Move to inbox`} />}
        />
    );

    const titleArchive = Shortcuts ? (
        <>
            {c('Action').t`Move to archive`}
            <br />
            <kbd className="border-none">A</kbd>
        </>
    ) : (
        c('Action').t`Move to archive`
    );

    const archiveButton = (
        <ToolbarButton
            key="archive"
            title={titleArchive}
            onClick={() => withLoading(onMove(ARCHIVE))}
            disabled={!selectedIDs.length}
            data-testid="toolbar:movetoarchive"
            icon={<Icon name="archive-box" alt={c('Action').t`Move to archive`} />}
        />
    );

    const titleSpam = Shortcuts ? (
        <>
            {c('Action').t`Move to spam`}
            <br />
            <kbd className="border-none">S</kbd>
        </>
    ) : (
        c('Action').t`Move to spam`
    );

    const spamButton = (
        <ToolbarButton
            key="spam"
            title={titleSpam}
            onClick={() => withLoading(onMove(SPAM))}
            disabled={loading || !selectedIDs.length}
            data-testid="toolbar:movetospam"
            icon={<Icon name="fire" alt={c('Action').t`Move to spam`} />}
        />
    );

    const titleNoSpam = Shortcuts ? (
        <>
            {c('Action').t`Move to inbox (not spam)`}
            <br />
            <kbd className="border-none">I</kbd>
        </>
    ) : (
        c('Action').t`Move to inbox (not spam)`
    );

    const nospamButton = (
        <ToolbarButton
            key="nospam"
            title={titleNoSpam}
            onClick={() => withLoading(onMove(INBOX))}
            disabled={loading || !selectedIDs.length}
            data-testid="toolbar:movetonospam"
            icon={<Icon name="fire-slash" alt={c('Action').t`Move to inbox (not spam)`} />}
        />
    );

    const titleTrash = Shortcuts ? (
        <>
            {c('Action').t`Move to trash`}
            <br />
            <kbd className="border-none">T</kbd>
        </>
    ) : (
        c('Action').t`Move to trash`
    );

    const trashButton = (
        <ToolbarButton
            key="trash"
            title={titleTrash}
            onClick={() => withLoading(onMove(TRASH))}
            disabled={loading || !selectedIDs.length}
            data-testid="toolbar:movetotrash"
            icon={<Icon name="trash" alt={c('Action').t`Move to trash`} />}
        />
    );

    const deleteButton = <DeleteButton key="delete" selectedIDs={selectedIDs} onDelete={onDelete} />;

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
    } else if (labelID === SCHEDULED) {
        buttons = [trashButton, archiveButton];
    } else if (labelID === STARRED) {
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

    return (
        <>
            <Vr />
            {buttons}
        </>
    );
};

export default MoveButtons;
