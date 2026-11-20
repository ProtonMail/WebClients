import type { ComposerMessageHost } from '@proton/mail-composer/host/composerMessageHost';
import { useUpdateMailSetting } from '@proton/mail/hooks/useUpdateMailSetting';
import { useContactGroups } from '@proton/mail/store/labels/hooks';
import { useGetMailSettings, useMailSettings } from '@proton/mail/store/mailSettings/hooks';

import EncryptionStatusIcon from '../components/message/EncryptionStatusIcon';
import AttachmentList from '../components/message/extrasFooter/attachment/AttachmentList';
import { useGetMessageKeys } from '../hooks/message/useGetMessageKeys';
import { useInitializeMessage } from '../hooks/message/useInitializeMessage';
import { useLoadEmbeddedImages, useLoadRemoteImages } from '../hooks/message/useLoadImages';
import { useMessage } from '../hooks/message/useMessage';
import { useCreateDraft, useDeleteDraft, useSaveDraft } from '../hooks/message/useSaveDraft';

const useUpdateDefaultFont = () => {
    const { update } = useUpdateMailSetting();
    return ({ fontFaceId, fontSize }: { fontFaceId?: string; fontSize?: number }, onSuccess?: () => void) => {
        // One "Preference saved" notification when both change
        const notifyOnce = fontFaceId !== undefined && fontSize !== undefined;
        let pending = [fontFaceId, fontSize].filter((value) => value !== undefined).length;
        const saved = () => {
            pending -= 1;
            if (pending === 0) {
                onSuccess?.();
            }
        };
        if (fontFaceId !== undefined) {
            update('FontFace', fontFaceId, { notify: !notifyOnce, onSuccess: saved });
        }
        if (fontSize !== undefined) {
            update('FontSize', fontSize, { onSuccess: saved });
        }
    };
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
    useUpdateDefaultFont,
    useContactGroups,
    EncryptionStatusIcon,
    AttachmentList,
};
