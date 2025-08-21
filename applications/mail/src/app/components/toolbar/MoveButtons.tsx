import { c } from 'ttag';

import { Kbd, Vr } from '@proton/atoms';
import { Icon, ToolbarButton } from '@proton/components';
import { useLoading } from '@proton/hooks';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';

import useMailModel from 'proton-mail/hooks/useMailModel';

import { useLabelActions } from '../../hooks/useLabelActions';
import { SOURCE_ACTION } from '../list/list-telemetry/useListTelemetry';
import DeleteButton from './DeleteButton';

interface Props {
    labelID: string;
    isExtraTiny: boolean;
    viewportIsNarrow?: boolean;
    selectedIDs: string[];
    onMove: (labelID: string, sourceAction: SOURCE_ACTION) => Promise<void>;
    onDelete: (sourceAction: SOURCE_ACTION) => Promise<void>;
}

const MoveButtons = ({ labelID = '', isExtraTiny, viewportIsNarrow, selectedIDs = [], onMove, onDelete }: Props) => {
    const { Shortcuts } = useMailModel('MailSettings');
    const [loading, withLoading] = useLoading();

    let [actions] = useLabelActions(labelID);
    if (isExtraTiny) {
        actions = [];
    }

    if (!selectedIDs.length) {
        return null;
    }

    const titleInbox = Shortcuts ? (
        <>
            {c('Action').t`Move to inbox`}
            <br />
            <Kbd shortcut="I" />
        </>
    ) : (
        c('Action').t`Move to inbox`
    );

    const inbox = (
        <ToolbarButton
            key="inbox"
            title={titleInbox}
            onClick={() => withLoading(onMove(MAILBOX_LABEL_IDS.INBOX, SOURCE_ACTION.TOOLBAR))}
            disabled={loading || !selectedIDs.length}
            data-testid="toolbar:movetoinbox"
            icon={<Icon name="inbox" alt={c('Action').t`Move to inbox`} />}
        />
    );

    const titleArchive = Shortcuts ? (
        <>
            {c('Action').t`Move to archive`}
            <br />
            <Kbd shortcut="A" />
        </>
    ) : (
        c('Action').t`Move to archive`
    );

    const archive = (
        <ToolbarButton
            key="archive"
            title={titleArchive}
            onClick={() => withLoading(onMove(MAILBOX_LABEL_IDS.ARCHIVE, SOURCE_ACTION.TOOLBAR))}
            disabled={!selectedIDs.length}
            data-testid="toolbar:movetoarchive"
            icon={<Icon name="archive-box" alt={c('Action').t`Move to archive`} />}
        />
    );

    const titleSpam = Shortcuts ? (
        <>
            {c('Action').t`Move to spam`}
            <br />
            <Kbd shortcut="S" />
        </>
    ) : (
        c('Action').t`Move to spam`
    );

    const spam = (
        <ToolbarButton
            key="spam"
            title={titleSpam}
            onClick={() => withLoading(onMove(MAILBOX_LABEL_IDS.SPAM, SOURCE_ACTION.TOOLBAR))}
            disabled={loading || !selectedIDs.length}
            data-testid="toolbar:movetospam"
            icon={<Icon name="fire" alt={c('Action').t`Move to spam`} />}
        />
    );

    const titleNoSpam = Shortcuts ? (
        <>
            {c('Action').t`Move to inbox (not spam)`}
            <br />
            <Kbd shortcut="I" />
        </>
    ) : (
        c('Action').t`Move to inbox (not spam)`
    );

    const nospam = (
        <ToolbarButton
            key="nospam"
            title={titleNoSpam}
            onClick={() => withLoading(onMove(MAILBOX_LABEL_IDS.INBOX, SOURCE_ACTION.TOOLBAR))}
            disabled={loading || !selectedIDs.length}
            data-testid="toolbar:movetonospam"
            icon={<Icon name="fire-slash" alt={c('Action').t`Move to inbox (not spam)`} />}
        />
    );

    const titleTrash = Shortcuts ? (
        <>
            {c('Action').t`Move to trash`}
            <br />
            <Kbd shortcut="T" />
        </>
    ) : (
        c('Action').t`Move to trash`
    );

    const trash = (
        <ToolbarButton
            key="trash"
            title={titleTrash}
            onClick={() => withLoading(onMove(MAILBOX_LABEL_IDS.TRASH, SOURCE_ACTION.TOOLBAR))}
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
            {!viewportIsNarrow && <Vr />}
            {buttons}
        </>
    );
};

export default MoveButtons;
