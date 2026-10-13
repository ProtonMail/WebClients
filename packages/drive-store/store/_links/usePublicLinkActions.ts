import { CryptoProxy } from '@protontech/crypto';

import { usePreventLeave } from '@proton/components';
import { queryPublicRenameLink } from '@proton/shared/lib/api/drive/share';
import { generateLookupHash } from '@proton/shared/lib/keys/driveKeys';
import { getDecryptedSessionKey } from '@proton/shared/lib/keys/drivePassphrase';
import getRandomString from '@proton/utils/getRandomString';

import { EnrichedError } from '../../utils/errorHandling/EnrichedError';
import { ValidationError } from '../../utils/errorHandling/ValidationError';
import { useAnonymousUploadAuthStore } from '../../zustand/upload/anonymous-auth.store';
import usePublicSession from '../_api/usePublicSession';
import useShare from '../_shares/useShare';
import useLink from './useLink';
import { validateLinkName } from './validation';

/**
 * usePublicLinkActions provides actions for manipulating with individual link in a public context.
 */
export function usePublicLinkActions() {
    const { preventLeave } = usePreventLeave();
    const { getUploadToken } = useAnonymousUploadAuthStore((state) => ({
        getUploadToken: state.getUploadToken,
    }));
    const { request: publicDebouncedRequest, getAddressKeyInfo } = usePublicSession();
    const { getLinkPrivateKey, getLinkHashKey, getLink } = useLink();
    const { getSharePrivateKey } = useShare();

    const renameLink = async (
        abortSignal: AbortSignal,
        { token, linkId, newName }: { token: string; linkId: string; newName: string }
    ) => {
        const error = validateLinkName(newName);
        if (error) {
            throw new ValidationError(error);
        }

        const [meta, addressKeyInfo] = await Promise.all([
            getLink(abortSignal, token, linkId),
            getAddressKeyInfo(abortSignal),
        ]);

        if (meta.corruptedLink) {
            throw new Error('Cannot rename corrupted file');
        }

        const [parentPrivateKey, parentHashKey] = await Promise.all([
            meta.parentLinkId
                ? getLinkPrivateKey(abortSignal, token, meta.parentLinkId)
                : getSharePrivateKey(abortSignal, token),
            meta.parentLinkId ? getLinkHashKey(abortSignal, token, meta.parentLinkId) : null,
        ]);

        const sessionKey = await getDecryptedSessionKey({
            data: meta.encryptedName,
            privateKeys: parentPrivateKey,
        }).catch((e) =>
            Promise.reject(
                new EnrichedError('Failed to decrypt link name session key during rename', {
                    tags: {
                        token,
                        linkId,
                    },
                    extra: { e },
                })
            )
        );

        const signingKeys = addressKeyInfo?.privateKey || parentPrivateKey;
        const authorizationToken = !addressKeyInfo ? getUploadToken(linkId) : undefined;

        const [Hash, { message: encryptedName }] = await Promise.all([
            parentHashKey
                ? generateLookupHash(newName, parentHashKey).catch((e) =>
                      Promise.reject(
                          new EnrichedError('Failed to generate link lookup hash during rename', {
                              tags: {
                                  token,
                                  linkId,
                              },
                              extra: { e },
                          })
                      )
                  )
                : getRandomString(64),
            CryptoProxy.encryptMessage({
                textData: newName,
                stripTrailingSpaces: true,
                sessionKey,
                signingKeys,
            }).catch((e) =>
                Promise.reject(
                    new EnrichedError('Failed to encrypt link name during rename', {
                        tags: {
                            token,
                            linkId,
                        },
                        extra: { e },
                    })
                )
            ),
        ]);

        await preventLeave(
            publicDebouncedRequest(
                queryPublicRenameLink(token, linkId, {
                    Name: encryptedName,
                    NameSignatureEmail: addressKeyInfo?.address.Email,
                    Hash,
                    OriginalHash: meta.hash,
                    AuthorizationToken: authorizationToken,
                })
            )
        );
    };

    return {
        renameLink,
    };
}
