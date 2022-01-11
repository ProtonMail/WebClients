import { NodeKeys } from '@proton/shared/lib/interfaces/drive/node';

import { LinkMapDecryptionBuffer } from './LinkDecryptionBuffer';
import { LinkMapLoader } from './LinkMapLoader';
import { createKeysCache } from './useKeysCache';
import { FetchShareMap } from '../useSearchAPI';

export const createLinkGenerator = (
    shareId: string,
    rootLinkKeys: NodeKeys,
    callbacks: {
        fetchShareMap: FetchShareMap;
    }
) => {
    const shareMapLoader = new LinkMapLoader({ fetchShareMapPage: callbacks.fetchShareMap });
    shareMapLoader.fetchShareMap(shareId).catch(console.warn);
    const shareMapGenerator = shareMapLoader.iterateItems();

    const linkMapBuffer = new LinkMapDecryptionBuffer(shareMapGenerator, createKeysCache(rootLinkKeys));
    linkMapBuffer.decrypt(shareId).catch(console.warn);
    const decryptedLinkMetaGenerator = linkMapBuffer.iterateItems();

    return decryptedLinkMetaGenerator;
};
