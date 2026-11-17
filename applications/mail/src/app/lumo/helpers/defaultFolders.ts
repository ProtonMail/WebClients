import { ToolInputError } from '@proton/llm/lib/lumoAgent/contracts/errors';
import type { FixedReference } from '@proton/llm/lib/lumoAgent/contracts/types';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { hasBit } from '@proton/shared/lib/helpers/bitset';
import type { MailSettings } from '@proton/shared/lib/interfaces/MailSettings';
import { ALMOST_ALL_MAIL, SHOW_MOVED } from '@proton/shared/lib/mail/mailSettings';

import { getStandardFolders } from '../../helpers/labels';

/**
 * Fixed references for the default folders every mailbox has. They are seeded into the session's registry,
 * so the model passes them in the same parameter as the user's own `folder-…` references, with no earlier read.
 */
export enum DefaultFolderReference {
    INBOX = 'folder-inbox',
    DRAFTS = 'folder-drafts',
    SENT = 'folder-sent',
    STARRED = 'folder-starred',
    ARCHIVE = 'folder-archive',
    SPAM = 'folder-spam',
    TRASH = 'folder-trash',
    ALL_MAIL = 'folder-all-mail',
    SCHEDULED = 'folder-scheduled',
    SNOOZED = 'folder-snoozed',
}

const DEFAULT_FOLDER_REFERENCES = Object.values(DefaultFolderReference);

/** For tool descriptions, so every one names the same ten. */
export const DEFAULT_FOLDER_LIST = DEFAULT_FOLDER_REFERENCES.join(', ');

/** The canonical label of each default folder. Three of them are one of a pair: see {@link defaultFolderLabelID}. */
const DEFAULT_FOLDER_LABEL_IDS: Record<DefaultFolderReference, MAILBOX_LABEL_IDS> = {
    [DefaultFolderReference.INBOX]: MAILBOX_LABEL_IDS.INBOX,
    [DefaultFolderReference.DRAFTS]: MAILBOX_LABEL_IDS.DRAFTS,
    [DefaultFolderReference.SENT]: MAILBOX_LABEL_IDS.SENT,
    [DefaultFolderReference.STARRED]: MAILBOX_LABEL_IDS.STARRED,
    [DefaultFolderReference.ARCHIVE]: MAILBOX_LABEL_IDS.ARCHIVE,
    [DefaultFolderReference.SPAM]: MAILBOX_LABEL_IDS.SPAM,
    [DefaultFolderReference.TRASH]: MAILBOX_LABEL_IDS.TRASH,
    [DefaultFolderReference.ALL_MAIL]: MAILBOX_LABEL_IDS.ALL_MAIL,
    [DefaultFolderReference.SCHEDULED]: MAILBOX_LABEL_IDS.SCHEDULED,
    [DefaultFolderReference.SNOOZED]: MAILBOX_LABEL_IDS.SNOOZED,
};

/** The other default folders are views or states, not places mail is filed. */
export const MOVE_DESTINATIONS: readonly DefaultFolderReference[] = [
    DefaultFolderReference.INBOX,
    DefaultFolderReference.ARCHIVE,
    DefaultFolderReference.SPAM,
    DefaultFolderReference.TRASH,
];

export const isDefaultFolderReference = (value: string): value is DefaultFolderReference => {
    return (DEFAULT_FOLDER_REFERENCES as string[]).includes(value);
};

/**
 * Three default folders are a PAIR of labels, and a mail setting picks which one the user has: Sent and
 * Drafts follow "show moved", and All mail follows "exclude Spam/Trash from All mail". Following the setting
 * keeps a read on the label the sidebar links to. Take `ALL_MAIL` unconditionally and the agent searches
 * mail the user's own search would never show them, in a view their sidebar does not offer.
 */
export const defaultFolderLabelID = (
    reference: DefaultFolderReference,
    mailSettings: MailSettings
): MAILBOX_LABEL_IDS => {
    if (reference === DefaultFolderReference.SENT && hasBit(mailSettings.ShowMoved, SHOW_MOVED.SENT)) {
        return MAILBOX_LABEL_IDS.ALL_SENT;
    }
    if (reference === DefaultFolderReference.DRAFTS && hasBit(mailSettings.ShowMoved, SHOW_MOVED.DRAFTS)) {
        return MAILBOX_LABEL_IDS.ALL_DRAFTS;
    }
    if (reference === DefaultFolderReference.ALL_MAIL && mailSettings.AlmostAllMail === ALMOST_ALL_MAIL.ENABLED) {
        return MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL;
    }
    return DEFAULT_FOLDER_LABEL_IDS[reference];
};

/** Labelled with the sidebar's own translated names, so a confirm card reads "Inbox", never `folder-inbox`. */
export const buildFixedReferences = (): FixedReference[] => {
    const standardFolders = getStandardFolders();

    return DEFAULT_FOLDER_REFERENCES.map((reference) => {
        const id = DEFAULT_FOLDER_LABEL_IDS[reference];
        return { reference, id, label: { title: standardFolders[id].name } };
    });
};

/** For the folder tools that only make sense on the user's own folders, such as rename or nesting. */
export const assertNotDefaultFolder = (reference: string, action: string): void => {
    if (isDefaultFolderReference(reference)) {
        throw new ToolInputError(
            `"${reference}" is a default folder, and default folders cannot ${action}. Pass one of the user's own folder-… references from list_folders instead.`
        );
    }
};
