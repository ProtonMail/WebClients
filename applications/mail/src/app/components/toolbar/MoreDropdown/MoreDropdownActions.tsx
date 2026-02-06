import { c } from 'ttag';

import DropdownMenuButton from '@proton/components/components/dropdown/DropdownMenuButton';
import { IcArchiveBox } from '@proton/icons/icons/IcArchiveBox';
import { IcCrossCircle } from '@proton/icons/icons/IcCrossCircle';
import { IcFire } from '@proton/icons/icons/IcFire';
import { IcFireSlash } from '@proton/icons/icons/IcFireSlash';
import { IcInbox } from '@proton/icons/icons/IcInbox';
import { IcTrash } from '@proton/icons/icons/IcTrash';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';

import { SOURCE_ACTION } from 'proton-mail/components/list/list-telemetry/useListTelemetry';

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
