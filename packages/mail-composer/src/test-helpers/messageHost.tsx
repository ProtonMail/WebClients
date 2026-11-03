import type { ContactGroup } from '@proton/shared/lib/interfaces/contacts/Contact';
import { DEFAULT_MAIL_SETTINGS } from '@proton/shared/lib/mail/mailSettings';

import type { ComposerHost } from '../hooks/composer/useComposerHost';
import type { ComposerMessageHost } from '../host/composerMessageHost';
import { useComposerSelector } from '../store/hooks';
import type { ComposerTestState } from './store';

const useTestMailSettings = () => {
    const mailSettings = useComposerSelector((state) => (state as unknown as ComposerTestState).mailSettings);
    return mailSettings?.value ?? DEFAULT_MAIL_SETTINGS;
};

const noopAsync = () => async () => {};

/** Reads messages and settings from the composer test store; draft writes and message loading resolve without doing anything. */
export const composerTestMessageHost: ComposerMessageHost = {
    useMessage: (localID) => {
        const message = useComposerSelector((state) => state.messages[localID]) ?? { localID };
        return { message, messageLoaded: !!message.data, bodyLoaded: !!message.messageDocument?.initialized };
    },
    useGetMessageKeys: () => async () => ({ type: 'publicPrivate', publicKeys: [], privateKeys: [] }) as any,
    useInitializeMessage: noopAsync,
    useLoadRemoteImages: noopAsync,
    useLoadEmbeddedImages: noopAsync,
    useCreateDraft: noopAsync,
    useSaveDraft: noopAsync,
    useDeleteDraft: noopAsync,
    useMailSettings: () => [useTestMailSettings(), false],
    useGetMailSettings: () => {
        const mailSettings = useTestMailSettings();
        return async () => mailSettings;
    },
    useContactGroups: () => {
        const groups = useComposerSelector(
            (state) => (state as unknown as ComposerTestState).categories?.value as ContactGroup[] | undefined
        );
        return [groups ?? [], false];
    },
    EncryptionStatusIcon: () => null,
    AttachmentList: () => null,
};

export const composerTestHost: ComposerHost = {
    scheduledCount: 0,
    scheduledCountLoading: false,
    onMessageSent: () => {},
    onDraftDiscarded: () => {},
};
