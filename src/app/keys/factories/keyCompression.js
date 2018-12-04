import { LARGE_KEY_SIZE } from '../../constants';

/* @ngInject */
function keyCompression(pmcw, confirm, $filter, gettextCatalog) {
    const humanSize = $filter('humanSize');
    const I18N = {
        REDUCE_KEY_SIZE_TITLE: gettextCatalog.getString('Reduce Key Size', null, 'Modal title'),
        reduceKeySizeText(fingerprint, newsize, oldsize) {
            return gettextCatalog.getString(
                `
            The key with fingerprint <code>{{ fingerprint }}</code> has a large size ({{ oldsize }}).
            By removing {{ diffsize }} of key certifications, the key size can be reduced to {{ newsize }}.
            Key certifications are not necessary for sending mail and could cause issues with performance and data usage.
            Would you like to remove these signatures?`,
                {
                    oldsize: humanSize(oldsize),
                    newsize: humanSize(newsize),
                    diffsize: humanSize(oldsize - newsize),
                    fingerprint: fingerprint.substring(0, 10)
                },
                'Modal message'
            );
        }
    };
    /**
     * Prompts the user to give him/her the option to reduce the key size by removing key certifications.
     * @param {String} oldKey The original armored key
     * @param {String} newKey The reduced armored key
     * @returns {Promise}
     */
    const askForCompression = async (oldKey, newKey) => {
        const [keyObject] = await pmcw.getKeys(oldKey);
        const fingerprint = keyObject.primaryKey.getFingerprint();

        return confirm({
            params: {
                class: 'very-important',
                title: I18N.REDUCE_KEY_SIZE_TITLE,
                message: I18N.reduceKeySizeText(fingerprint, newKey.length, oldKey.length)
            }
        });
    };

    /**
     * Prompts the user whether it wants to reduce the key size, returns the compressed key, if the user choses this,
     * otherwise the original key is chosen.
     * @param armoredKey
     * @returns {Promise.<*>}
     */
    const compressKey = async (armoredKey) => {
        // We don't need to do anything if the key is not really big
        if (armoredKey.length < LARGE_KEY_SIZE) {
            return armoredKey;
        }
        const compressedKey = await pmcw.compressKey(armoredKey);

        // Compression was not really effective, just skip compression
        if (compressedKey.length > LARGE_KEY_SIZE && compressedKey.length > armoredKey * 0.6) {
            return armoredKey;
        }

        // Prompts the user if it wants to compress the key.
        const compress = await askForCompression(armoredKey, compressedKey);
        return compress ? compressedKey : armoredKey;
    };

    return { compressKey };
}

export default keyCompression;
