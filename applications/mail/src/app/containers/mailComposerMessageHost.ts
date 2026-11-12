import { useCallback } from 'react';

import type { ComposerMessageHost } from '@proton/mail-composer/host/composerMessageHost';
import { useContactGroups } from '@proton/mail/store/labels/hooks';
import { mailSettingsActions } from '@proton/mail/store/mailSettings';
import { useGetMailSettings, useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import type { MailSettings } from '@proton/shared/lib/interfaces/MailSettings';

import EncryptionStatusIcon from '../components/message/EncryptionStatusIcon';
import AttachmentList from '../components/message/extrasFooter/attachment/AttachmentList';
import { useGetMessageKeys } from '../hooks/message/useGetMessageKeys';
import { useInitializeMessage } from '../hooks/message/useInitializeMessage';
import { useLoadEmbeddedImages, useLoadRemoteImages } from '../hooks/message/useLoadImages';
import { useMessage } from '../hooks/message/useMessage';
import { useCreateDraft, useDeleteDraft, useSaveDraft } from '../hooks/message/useSaveDraft';
import { useMailDispatch } from '../store/hooks';

const useUpdateMailSettings = () => {
    const dispatch = useMailDispatch();
    return useCallback(
        (mailSettings: MailSettings) => {
            dispatch(mailSettingsActions.updateMailSettings(mailSettings));
        },
        [dispatch]
    );
};

export const mailComposerMessageHost: ComposerMessageHost = {
    useMessage,
    useGetMessageKeys,
    useInitializeMessage,
    useLoadRemoteImages,
    useLoadEmbeddedImages,
    useCreateDraft,
    useSaveDraft,
    useDeleteDraft,
    useMailSettings,
    useGetMailSettings,
    useUpdateMailSettings,
    useContactGroups,
    EncryptionStatusIcon,
    AttachmentList,
};
