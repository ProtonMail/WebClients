import type { SHARE_MEMBER_PERMISSIONS } from '@proton/shared/lib/drive/constants';
import mergeUint8Arrays from '@proton/utils/mergeUint8Arrays';

import { useDownload } from '../../store/_downloads';
import { useLink, validateLinkName } from '../../store/_links';
import { useDirectSharingInfo } from '../../store/_shares/useDirectSharingInfo';
import useUploadHelper from '../../store/_uploads/UploadProvider/useUploadHelper';
import { useAbortSignal } from '../../store/_views/utils';
import { ValidationError } from '../../utils/errorHandling/ValidationError';
import { streamToBuffer } from '../../utils/stream';
import type { LegacyNodeMeta } from '../interface';
import type { DecryptedNode } from './interface';
import { decryptedLinkToNode } from './utils';

export const useNode = () => {
    const { getLink } = useLink();
    const { getSharePermissions } = useDirectSharingInfo();
    const { downloadStream } = useDownload();
    const { findAvailableName } = useUploadHelper();
    const abortSignal = useAbortSignal([]);

    const getNode = async ({ shareId, linkId, volumeId }: LegacyNodeMeta): Promise<DecryptedNode> => {
        const link = await getLink(abortSignal, shareId, linkId);

        return decryptedLinkToNode(link, volumeId);
    };

    const getNodeContents = async ({
        shareId,
        linkId,
        volumeId,
    }: LegacyNodeMeta): Promise<{
        contents: Uint8Array;
        node: DecryptedNode;
    }> => {
        const link = await getLink(abortSignal, shareId, linkId);

        const { stream, controls } = downloadStream({
            ...link,
            shareId,
        });
        const cancelListener = () => {
            controls.cancel();
        };
        abortSignal.addEventListener('abort', cancelListener);
        const buffer = await streamToBuffer(stream);
        abortSignal.removeEventListener('abort', cancelListener);

        return {
            contents: mergeUint8Arrays(buffer),
            node: decryptedLinkToNode(link, volumeId),
        };
    };

    const getNodePermissions = async ({ shareId }: LegacyNodeMeta): Promise<SHARE_MEMBER_PERMISSIONS> => {
        return getSharePermissions(abortSignal, shareId);
    };

    const findAvailableNodeName = async (
        { shareId, linkId: parentLinkId }: LegacyNodeMeta,
        filename: string
    ): Promise<string> => {
        const error = validateLinkName(filename);

        if (error) {
            throw new ValidationError(error);
        }

        const name = await findAvailableName(abortSignal, { shareId, parentLinkId, filename });

        return name.filename;
    };

    return {
        getNode,
        getNodeContents,
        getNodePermissions,
        findAvailableNodeName,
    };
};

export default useNode;
