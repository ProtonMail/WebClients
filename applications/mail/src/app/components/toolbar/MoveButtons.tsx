import { c } from 'ttag';
import { Icon, useLoading, useMailSettings, ToolbarButton } from '@proton/components';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { Vr } from '@proton/atoms';
import DeleteButton from './DeleteButton';
import { useLabelActions } from '../../hooks/useLabelActions';

const { TRASH, SPAM, ARCHIVE, INBOX } = MAILBOX_LABEL_IDS;

interface Props {
    labelID: string;
    isNarrow: boolean;
    selectedIDs: string[];
    onMove: (labelID: string) => Promise<void>;
    onDelete: () => Promise<void>;
}

const MoveButtons = ({ labelID = '', isNarrow, selectedIDs = [], onMove, onDelete }: Props) => {
    const [{ Shortcuts = 0 } = {}] = useMailSettings();
    const [loading, withLoading] = useLoading();

    const [actions] = useLabelActions(labelID, isNarrow);

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

    const inbox = (
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

    const archive = (
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

    const spam = (
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

    const nospam = (
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

    const trash = (
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

    const allButtons = { inbox, trash, archive, spam, nospam, delete: deleteButton };
    const buttons = actions.map((action) => allButtons[action]);

    return (
        <>
            <Vr />
            {buttons}
        </>
    );
};

export default MoveButtons;
