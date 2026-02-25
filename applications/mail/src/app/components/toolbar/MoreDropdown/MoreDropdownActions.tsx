import { c } from 'ttag';

import DropdownMenuButton from '@proton/components/components/dropdown/DropdownMenuButton';
import { IcArchiveBox } from '@proton/icons/icons/IcArchiveBox';
import { IcCrossCircle } from '@proton/icons/icons/IcCrossCircle';
import { IcFire } from '@proton/icons/icons/IcFire';
import { IcFireSlash } from '@proton/icons/icons/IcFireSlash';
import { IcInbox } from '@proton/icons/icons/IcInbox';
import { IcTrash } from '@proton/icons/icons/IcTrash';
import { TelemetryMailSelectAllEvents } from '@proton/shared/lib/api/telemetry';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';

import useListTelemetry, {
    ACTION_TYPE,
    SELECTED_RANGE,
    SOURCE_ACTION,
} from 'proton-mail/components/list/list-telemetry/useListTelemetry';
import { type MoveAllToFolderArgs, MoveAllType } from 'proton-mail/hooks/actions/move/useMoveAllToFolder';

interface ActionProps {
    onMove: (labelID: string, sourceAction: SOURCE_ACTION) => void;
}

interface DeleteActionProps {
    onDelete: (sourceAction: SOURCE_ACTION) => void;
}

export const InboxAction = ({ onMove }: ActionProps) => {
    return (
        <DropdownMenuButton
            key="context-menu-inbox"
            className="text-left"
            onClick={() => onMove(MAILBOX_LABEL_IDS.INBOX, SOURCE_ACTION.TOOLBAR)}
            data-testid="toolbar:more-dropdown--movetoinbox"
        >
            <IcInbox className="mr-2" />
            {c('Action').t`Move to inbox`}
        </DropdownMenuButton>
    );
};

export const NoSpamAction = ({ onMove }: ActionProps) => {
    return (
        <DropdownMenuButton
            key="context-menu-nospam"
            className="text-left"
            onClick={() => onMove(MAILBOX_LABEL_IDS.INBOX, SOURCE_ACTION.TOOLBAR)}
            data-testid="toolbar:more-dropdown--movetonospam"
        >
            <IcFireSlash className="mr-2" />
            {c('Action').t`Move to inbox (not spam)`}
        </DropdownMenuButton>
    );
};

export const ArchiveAction = ({ onMove }: ActionProps) => {
    return (
        <DropdownMenuButton
            key="context-menu-archive"
            className="text-left"
            onClick={() => onMove(MAILBOX_LABEL_IDS.ARCHIVE, SOURCE_ACTION.TOOLBAR)}
            data-testid="toolbar:more-dropdown--movetonoarchive"
        >
            <IcArchiveBox className="mr-2" />
            {c('Action').t`Move to archive`}
        </DropdownMenuButton>
    );
};

export const TrashAction = ({ onMove }: ActionProps) => {
    return (
        <DropdownMenuButton
            key="context-menu-trash"
            className="text-left"
            onClick={() => onMove(MAILBOX_LABEL_IDS.TRASH, SOURCE_ACTION.TOOLBAR)}
            data-testid="toolbar:more-dropdown--movetotrash"
        >
            <IcTrash className="mr-2" />
            {c('Action').t`Move to trash`}
        </DropdownMenuButton>
    );
};

export const SpamAction = ({ onMove }: ActionProps) => {
    return (
        <DropdownMenuButton
            key="context-menu-spam"
            className="text-left"
            onClick={() => onMove(MAILBOX_LABEL_IDS.SPAM, SOURCE_ACTION.TOOLBAR)}
            data-testid="toolbar:more-dropdown--movetospam"
        >
            <IcFire className="mr-2" />
            {c('Action').t`Move to spam`}
        </DropdownMenuButton>
    );
};

export const DeleteAction = ({ onDelete }: DeleteActionProps) => {
    return (
        <DropdownMenuButton
            key="context-menu-delete"
            className="text-left"
            onClick={() => onDelete(SOURCE_ACTION.TOOLBAR)}
            data-testid="toolbar:more-dropdown--delete"
        >
            <IcCrossCircle className="mr-2" />
            {c('Action').t`Delete`}
        </DropdownMenuButton>
    );
};

export const MoveAllToTrashAction = ({
    labelID,
    moveAllToFolder,
}: {
    labelID: string;
    moveAllToFolder: (args: MoveAllToFolderArgs) => void;
}) => {
    const handleMoveAllToTrash = () => {
        void moveAllToFolder({
            type: MoveAllType.moveAll,
            sourceLabelID: labelID,
            destinationLabelID: MAILBOX_LABEL_IDS.TRASH,
            telemetryEvent: TelemetryMailSelectAllEvents.button_move_to_trash,
            sourceAction: SOURCE_ACTION.MORE_DROPDOWN,
        });
    };

    return (
        <>
            <DropdownMenuButton
                className="text-left inline-flex flex-nowrap"
                onClick={handleMoveAllToTrash}
                data-testid="toolbar:moveAllToTrash"
            >
                <IcTrash className="mr-2 shrink-0 mt-0.5" />
                <span className="flex-1">
                    {
                        // translator: This action will move all messages from the location to trash
                        // Beware when translating this one because we might also have a button below,
                        // which is deleting all messages. This is different
                        c('Action').t`Move all to trash`
                    }
                </span>
            </DropdownMenuButton>
        </>
    );
};

export const MoveAllToArchiveAction = ({
    labelID,
    moveAllToFolder,
}: {
    labelID: string;
    moveAllToFolder: (args: MoveAllToFolderArgs) => void;
}) => {
    const handleMoveAllToArchive = () => {
        void moveAllToFolder({
            type: MoveAllType.moveAll,
            sourceLabelID: labelID,
            destinationLabelID: MAILBOX_LABEL_IDS.ARCHIVE,
            telemetryEvent: TelemetryMailSelectAllEvents.button_move_to_archive,
            sourceAction: SOURCE_ACTION.MORE_DROPDOWN,
        });
    };

    return (
        <>
            <DropdownMenuButton
                className="text-left inline-flex flex-nowrap"
                onClick={handleMoveAllToArchive}
                data-testid="toolbar:moveAllToArchive"
            >
                <IcArchiveBox className="mr-2 shrink-0 mt-0.5" />
                <span className="flex-1">{c('Action').t`Move all to archive`}</span>
            </DropdownMenuButton>
        </>
    );
};

export const DeleteAllAction = ({
    labelID,
    emptyLabel,
}: {
    labelID: string;
    emptyLabel: (labelID: string) => void;
}) => {
    const { sendSimpleActionReport } = useListTelemetry();

    const handleEmptyLabel = () => {
        sendSimpleActionReport({
            actionType: ACTION_TYPE.DELETE_PERMANENTLY,
            actionLocation: SOURCE_ACTION.TOOLBAR,
            numberMessage: SELECTED_RANGE.ALL,
        });
        void emptyLabel(labelID);
    };

    return (
        <>
            <DropdownMenuButton
                className="text-left inline-flex flex-nowrap color-danger"
                onClick={handleEmptyLabel}
                data-testid="toolbar:more-empty"
            >
                <IcCrossCircle className="mr-2 shrink-0 mt-0.5" />
                <span className="flex-1">{
                    // translator: This action will delete permanently all messages from the location
                    // Beware when translating this one because we might also have a button on top,
                    // which is moving messages to trash. This is different
                    c('Action').t`Delete all`
                }</span>
            </DropdownMenuButton>
        </>
    );
};
