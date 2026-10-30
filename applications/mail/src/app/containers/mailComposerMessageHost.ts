import type { ComposerMessageHost } from '@proton/mail-composer/host/composerMessageHost';

import EncryptionStatusIcon from '../components/message/EncryptionStatusIcon';
import AttachmentList from '../components/message/extrasFooter/attachment/AttachmentList';
import { useGetMessageKeys } from '../hooks/message/useGetMessageKeys';
import { useInitializeMessage } from '../hooks/message/useInitializeMessage';
import { useLoadEmbeddedImages, useLoadRemoteImages } from '../hooks/message/useLoadImages';
import { useMessage } from '../hooks/message/useMessage';
import { useCreateDraft, useDeleteDraft, useSaveDraft } from '../hooks/message/useSaveDraft';

export const mailComposerMessageHost: ComposerMessageHost = {
    useMessage,
    useGetMessageKeys,
    useInitializeMessage,
    useLoadRemoteImages,
    useLoadEmbeddedImages,
    useCreateDraft,
    useSaveDraft,
    useDeleteDraft,
    EncryptionStatusIcon,
    AttachmentList,
};
