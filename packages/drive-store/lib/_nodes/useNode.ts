import mergeUint8Arrays from '@proton/utils/mergeUint8Arrays';

import { useDownload } from '../../store/_downloads';
import { useLink } from '../../store/_links';
import { useAbortSignal } from '../../store/_views/utils';
import { streamToBuffer } from '../../utils/stream';
import { LegacyNodeMeta } from '../interface';
import { DecryptedNode } from './interface';
import { decryptedLinkToNode } from './utils';

export const useNode = () => {
    const { getLink } = useLink();
    const { downloadStream } = useDownload();
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

        const { stream, controls } = downloadStream([
            {
                ...link,
                shareId,
            },
        ]);
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

    return {
        getNode,
        getNodeContents,
    };
};

export default useNode;
