import { c } from 'ttag';

import { Kbd } from '@proton/atoms/Kbd/Kbd';
import { Vr } from '@proton/atoms/Vr/Vr';
import { ToolbarButton } from '@proton/components';
import { IcArchiveBox, IcFire, IcFireSlash, IcInbox, IcTrash } from '@proton/icons';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';

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
    const [{ Shortcuts }] = useMailSettings();

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
            onClick={() => onMove(MAILBOX_LABEL_IDS.INBOX, SOURCE_ACTION.TOOLBAR)}
            data-testid="toolbar:movetoinbox"
            icon={<IcInbox alt={c('Action').t`Move to inbox`} />}
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
            onClick={() => onMove(MAILBOX_LABEL_IDS.ARCHIVE, SOURCE_ACTION.TOOLBAR)}
            data-testid="toolbar:movetoarchive"
            icon={<IcArchiveBox alt={c('Action').t`Move to archive`} />}
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
            onClick={() => onMove(MAILBOX_LABEL_IDS.SPAM, SOURCE_ACTION.TOOLBAR)}
            data-testid="toolbar:movetospam"
            icon={<IcFire alt={c('Action').t`Move to spam`} />}
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
            onClick={() => onMove(MAILBOX_LABEL_IDS.INBOX, SOURCE_ACTION.TOOLBAR)}
            data-testid="toolbar:movetonospam"
            icon={<IcFireSlash alt={c('Action').t`Move to inbox (not spam)`} />}
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
            onClick={() => onMove(MAILBOX_LABEL_IDS.TRASH, SOURCE_ACTION.TOOLBAR)}
            data-testid="toolbar:movetotrash"
            icon={<IcTrash alt={c('Action').t`Move to trash`} />}
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
