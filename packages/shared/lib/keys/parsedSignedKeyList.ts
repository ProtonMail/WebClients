import type { SignedKeyListItem } from '../interfaces';
import type { SimpleMap } from '../interfaces/utils';

const signedKeyListItemParser = ({ Primary, Flags, Fingerprint, SHA256Fingerprints }: any) =>
    (Primary === 0 || Primary === 1) &&
    typeof Flags === 'number' &&
    typeof Fingerprint === 'string' &&
    Array.isArray(SHA256Fingerprints) &&
    SHA256Fingerprints.every((fingerprint) => typeof fingerprint === 'string');

export class ParsedSignedKeyList {
    private parsedSignedKeyList: SignedKeyListItem[] | null;

    constructor(data?: string) {
        if (!data) {
            this.parsedSignedKeyList = null;
            return;
        }

        try {
            const parsedDataToValidate = JSON.parse(data);
            if (Array.isArray(parsedDataToValidate) && parsedDataToValidate.every(signedKeyListItemParser)) {
                this.parsedSignedKeyList = parsedDataToValidate;
            } else {
                this.parsedSignedKeyList = null;
            }
        } catch (e: any) {
            this.parsedSignedKeyList = null;
        }
    }

    getParsedSignedKeyList() {
        return this.parsedSignedKeyList;
    }

    /**
     * @returns mapping between the ID of each address key to the corresponding parsed SKL item
     */
    mapAddressKeysToSKLItems(keys: { ID: string; sha256Fingerprints: string[] }[]) {
        const parsedSignedKeyList = this.getParsedSignedKeyList();
        if (!parsedSignedKeyList) {
            return {};
        }
        /**
         * NB:
         * - Primary key fingerprint is not guaranteed to be unique
         * - there exist old users who have duplicate keys (same subkey fingerprints too)
         **/
        const mapFingerprintsToItems = parsedSignedKeyList.reduce<SimpleMap<SignedKeyListItem[]>>((acc, cur) => {
            const fingerprints = cur.SHA256Fingerprints.join();
            if (acc[fingerprints]) {
                acc[fingerprints].push(cur);
            } else {
                acc[fingerprints] = [cur];
            }
            return acc;
        }, {});

        const resultMap: SimpleMap<SignedKeyListItem | undefined> = {};
        for (const { ID, sha256Fingerprints } of keys) {
            const sklItems = mapFingerprintsToItems[sha256Fingerprints.join()];
            if (!sklItems) {
                resultMap[ID] = undefined;
            } else if (sklItems.length === 1) {
                resultMap[ID] = sklItems[0];
            } else {
                // Edge case, user has identical keys: we just trust the `keys` order for the matching.
                // This can cause matching issues if e.g. the SKL contains duplicate keys that are now inactive,
                // hence they are not necessarily passed as `keys` (depending on the caller use-case).
                // We do not address these edge-cases as we don't expect any user to actually have such setups.
                resultMap[ID] = sklItems[0];
                sklItems.splice(0, 1);
            }
        }
        return resultMap;
    }
}
