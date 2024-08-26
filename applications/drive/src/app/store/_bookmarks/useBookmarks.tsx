import { CryptoProxy } from '@proton/crypto/lib';
import {
    queryCreateShareURLBookmark,
    queryDeleteShareURLBookmark,
    queryListShareURLBookmark,
} from '@proton/shared/lib/api/drive/bookmark';
import type { BookmarkPayload } from '@proton/shared/lib/interfaces/drive/bookmark';

import { useDebouncedRequest } from '../_api';
import { useDefaultShare, useShare } from '../_shares';

export const useBookmarks = () => {
    const debouncedRequest = useDebouncedRequest();
    const { getDefaultShare } = useDefaultShare();
    const { getShareCreatorKeys } = useShare();

    const listBookmarks = (abortSignal: AbortSignal) =>
        debouncedRequest<{ Code: number; Bookmarks: BookmarkPayload[] }>(queryListShareURLBookmark(), abortSignal).then(
            ({ Bookmarks }) =>
                Bookmarks.map((bookmark) => ({
                    encryptedUrlPasword: bookmark.EncryptedUrlPassword,
                    createTime: bookmark.CreateTime,
                    token: bookmark.Token,
                }))
        );

    const addBookmark = async (
        abortSignal: AbortSignal,
        { token, urlPassword }: { token: string; urlPassword: string }
    ) => {
        const defaultShare = await getDefaultShare();
        const { address, addressKeyID, privateKey } = await getShareCreatorKeys(
            new AbortController().signal,
            defaultShare.shareId
        );

        const signature = await CryptoProxy.signMessage({
            textData: urlPassword,
            signingKeys: privateKey,
            format: 'binary',
            detached: true,
        });

        const result = await CryptoProxy.encryptMessage({
            encryptionKeys: privateKey,
            textData: urlPassword,
            binarySignature: signature,
        });
        return debouncedRequest<{ Code: number; BookmarkShareURL: { Token: string } }>(
            queryCreateShareURLBookmark(token, {
                BookmarkShareURL: {
                    EncryptedUrlPassword: result.message,
                    AddressID: address.ID,
                    AddressKeyID: addressKeyID,
                },
            }),
            abortSignal
        ).then(({ BookmarkShareURL }) => BookmarkShareURL.Token);
    };

    const deleteBookmark = async (abortSignal: AbortSignal, token: string) => {
        await debouncedRequest(queryDeleteShareURLBookmark(token), abortSignal);
    };

    return {
        listBookmarks,
        addBookmark,
        deleteBookmark,
    };
};
