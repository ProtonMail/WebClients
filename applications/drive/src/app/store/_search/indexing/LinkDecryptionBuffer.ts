import { PrivateKeyReference } from '@proton/crypto';
import { HARDWARE_CONCURRENCY } from '@proton/shared/lib/drive/constants';
import { wait } from '@proton/shared/lib/helpers/promise';
import { ShareMapLink } from '@proton/shared/lib/interfaces/drive/link';

import { runInQueueAbortable } from '../../../utils/parallelRunners';
import { ESLink } from '../types';
import { convertLinkToESItem } from '../utils';
import { KeyCache } from './useKeysCache';

export class LinkMapDecryptionBuffer {
    keyCache;

    decryptedLinks: ESLink[] = [];

    decryptionQueue: ShareMapLink[][] = [];

    isDone: boolean = false;

    encryptedItems;

    constructor(encryptedItemsGenerator: AsyncGenerator<ShareMapLink[]>, keyCache: KeyCache) {
        this.encryptedItems = encryptedItemsGenerator;
        this.keyCache = keyCache;
    }

    async decryptLink(linkMeta: ShareMapLink, shareId: string, privateKey: PrivateKeyReference) {
        const { name: decryptedName } = await this.keyCache.decryptAndCacheLink(linkMeta, privateKey);

        if (linkMeta.ParentLinkID && decryptedName) {
            this.decryptedLinks.push(
                await convertLinkToESItem(
                    {
                        ...linkMeta,
                        Name: decryptedName,
                    },
                    shareId
                )
            );
        }
    }

    async decryptLinkMetas(linkMetaPage: ShareMapLink[], shareId: string) {
        const page = [...linkMetaPage];

        while (page.length) {
            const availableParentKeyIndex = page.findIndex((linkMeta) => {
                return !this.keyCache.getCachedPrivateKey(linkMeta.ParentLinkID);
            });

            const spliceEndIndex = availableParentKeyIndex === -1 ? page.length : availableParentKeyIndex;
            const readyToDecryptLinks = page.splice(0, spliceEndIndex);

            if (readyToDecryptLinks.length === 0) {
                console.error('ES: parentKeys are missing');
                break;
            }

            await runInQueueAbortable(
                readyToDecryptLinks.map((linkMeta) => () => {
                    const privateKey = this.keyCache.getCachedPrivateKey(linkMeta.ParentLinkID);
                    return this.decryptLink(linkMeta, shareId, privateKey!);
                }),
                HARDWARE_CONCURRENCY
            );
        }
    }

    async decrypt(shareId: string) {
        for await (const linkMetaBatch of this.encryptedItems) {
            await this.decryptLinkMetas(linkMetaBatch, shareId);
        }

        this.isDone = true;
    }

    async *iterateItems() {
        while (!this.isDone || this.decryptedLinks.length > 0) {
            const { length } = this.decryptedLinks;

            // These numbers were picked more or less randomly.
            // Feel free to change them if any tweak is needed.
            if (this.isDone || length > 200) {
                yield this.decryptedLinks.splice(0, length);
            } else {
                await wait(1000);
            }
        }
    }
}
