import { OpenPGPKey } from 'pmcrypto';

import { HARDWARE_CONCURRENCY } from '@proton/shared/lib/drive/constants';
import { ShareMapLink } from '@proton/shared/lib/interfaces/drive/link';
import { wait } from '@proton/shared/lib/helpers/promise';

import { ESLink } from '../types';
import { KeyCache } from './useKeysCache';
import { convertLinkToESItem } from '../utils';
import { runInQueueAbortable } from '../../../utils/parallelRunners';

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

    async decryptLink(linkMeta: ShareMapLink, shareId: string, privateKey: OpenPGPKey) {
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

            // TODO: remove later
            // const startTime = performance.now();
            await runInQueueAbortable(
                readyToDecryptLinks.map((linkMeta) => () => {
                    const privateKey = this.keyCache.getCachedPrivateKey(linkMeta.ParentLinkID);
                    return this.decryptLink(linkMeta, shareId, privateKey!);
                }),
                HARDWARE_CONCURRENCY
            );
            // const endTime = performance.now()
            // console.log(`Decryption took ${Math.round(endTime - startTime) / 1000} seconds for ${readyToDecryptLinks.length} items`);
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

            // TODO: these numbers should be tuned later
            if (this.isDone || length > 200) {
                yield this.decryptedLinks.splice(0, length);
            } else {
                await wait(2000);
            }
        }
    }
}
