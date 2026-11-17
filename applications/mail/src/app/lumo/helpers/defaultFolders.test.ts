import { ToolInputError } from '@proton/llm/lib/lumoAgent/contracts/errors';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import type { MailSettings } from '@proton/shared/lib/interfaces/MailSettings';
import { ALMOST_ALL_MAIL, SHOW_MOVED } from '@proton/shared/lib/mail/mailSettings';

import {
    DefaultFolderReference,
    assertNotDefaultFolder,
    buildFixedReferences,
    defaultFolderLabelID,
    isDefaultFolderReference,
} from './defaultFolders';

const settings = (overrides: Partial<MailSettings> = {}): MailSettings => {
    return { ShowMoved: SHOW_MOVED.NONE, AlmostAllMail: ALMOST_ALL_MAIL.DISABLED, ...overrides } as MailSettings;
};

const ALL_SETTINGS_ON = settings({ ShowMoved: SHOW_MOVED.DRAFTS_AND_SENT, AlmostAllMail: ALMOST_ALL_MAIL.ENABLED });

describe('defaultFolderLabelID', () => {
    it.each<[DefaultFolderReference, MAILBOX_LABEL_IDS, MAILBOX_LABEL_IDS]>([
        [DefaultFolderReference.INBOX, MAILBOX_LABEL_IDS.INBOX, MAILBOX_LABEL_IDS.INBOX],
        [DefaultFolderReference.DRAFTS, MAILBOX_LABEL_IDS.DRAFTS, MAILBOX_LABEL_IDS.ALL_DRAFTS],
        [DefaultFolderReference.SENT, MAILBOX_LABEL_IDS.SENT, MAILBOX_LABEL_IDS.ALL_SENT],
        [DefaultFolderReference.STARRED, MAILBOX_LABEL_IDS.STARRED, MAILBOX_LABEL_IDS.STARRED],
        [DefaultFolderReference.ARCHIVE, MAILBOX_LABEL_IDS.ARCHIVE, MAILBOX_LABEL_IDS.ARCHIVE],
        [DefaultFolderReference.SPAM, MAILBOX_LABEL_IDS.SPAM, MAILBOX_LABEL_IDS.SPAM],
        [DefaultFolderReference.TRASH, MAILBOX_LABEL_IDS.TRASH, MAILBOX_LABEL_IDS.TRASH],
        [DefaultFolderReference.ALL_MAIL, MAILBOX_LABEL_IDS.ALL_MAIL, MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL],
        [DefaultFolderReference.SCHEDULED, MAILBOX_LABEL_IDS.SCHEDULED, MAILBOX_LABEL_IDS.SCHEDULED],
        [DefaultFolderReference.SNOOZED, MAILBOX_LABEL_IDS.SNOOZED, MAILBOX_LABEL_IDS.SNOOZED],
    ])('maps %s to %s with the settings off and %s with them on', (reference, off, on) => {
        expect(defaultFolderLabelID(reference, settings())).toBe(off);
        expect(defaultFolderLabelID(reference, ALL_SETTINGS_ON)).toBe(on);
    });

    it('follows each "show moved" bit on its own', () => {
        const sentOnly = settings({ ShowMoved: SHOW_MOVED.SENT });

        expect(defaultFolderLabelID(DefaultFolderReference.SENT, sentOnly)).toBe(MAILBOX_LABEL_IDS.ALL_SENT);
        expect(defaultFolderLabelID(DefaultFolderReference.DRAFTS, sentOnly)).toBe(MAILBOX_LABEL_IDS.DRAFTS);
    });
});

describe('buildFixedReferences', () => {
    it('reserves each default folder under its canonical label and sidebar name', () => {
        const fixed = buildFixedReferences();

        expect(fixed.find(({ reference }) => reference === DefaultFolderReference.INBOX)).toEqual({
            reference: DefaultFolderReference.INBOX,
            id: MAILBOX_LABEL_IDS.INBOX,
            label: { title: 'Inbox' },
        });
        expect(fixed.find(({ reference }) => reference === DefaultFolderReference.SENT)?.label.title).toBe('Sent');
    });
});

describe('isDefaultFolderReference', () => {
    it('knows the fixed names and nothing else', () => {
        expect(isDefaultFolderReference(DefaultFolderReference.INBOX)).toBe(true);
        expect(isDefaultFolderReference('folder-x7b2q1')).toBe(false);
        expect(isDefaultFolderReference('folder-outbox')).toBe(false);
    });
});

describe('assertNotDefaultFolder', () => {
    it('refuses a default folder with an error the model can correct', () => {
        expect(() => assertNotDefaultFolder(DefaultFolderReference.INBOX, 'be renamed')).toThrow(ToolInputError);
        expect(() => assertNotDefaultFolder(DefaultFolderReference.INBOX, 'be renamed')).toThrow(/cannot be renamed/);
    });

    it('lets the user’s own folders through', () => {
        expect(() => assertNotDefaultFolder('folder-x7b2q1', 'be renamed')).not.toThrow();
    });
});
