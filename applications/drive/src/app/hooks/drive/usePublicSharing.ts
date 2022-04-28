import { useRef } from 'react';
import { decryptMessage, decryptPrivateKey, getMessage, OpenPGPKey } from 'pmcrypto';

import { computeKeyPassword } from '@proton/srp';
import { useApi } from '@proton/components';
import { base64StringToUint8Array } from '@proton/shared/lib/helpers/encoding';
import { decryptUnsigned } from '@proton/shared/lib/keys/driveKeys';
import { ThumbnailURLInfo, SharedURLRevision, SharedURLInfo } from '@proton/shared/lib/interfaces/drive/sharing';
import { getDecryptedSessionKey } from '@proton/shared/lib/keys/drivePassphrase';
import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { LinkMeta, LinkType } from '@proton/shared/lib/interfaces/drive/link';
import { FOLDER_PAGE_SIZE } from '@proton/shared/lib/drive/constants';
import { NodeKeys } from '@proton/shared/lib/interfaces/drive/node';
import {
    querySharedURLChildren,
    querySharedURLFileRevision,
    querySharedURLInformation,
    querySubmitAbuseReport,
} from '@proton/shared/lib/api/drive/sharing';

import { DecryptedLink, EncryptedLink } from '../../store';
import { linkMetaToEncryptedLink } from '../../store/_api/transformers';
import { DownloadControls, DownloadEventCallbacks, LinkDownload, Pagination } from '../../store';
import downloadThumbnailPure from '../../store/_downloads/download/downloadThumbnail';
import initDownloadPure from '../../store/_downloads/download/download';
import usePublicSession from '../../components/DownloadShared/usePublicSession';
import retryOnError from '../../utils/retryOnError';

export interface SharedURLInfoDecrypted {
    expirationTime: SharedURLInfo['ExpirationTime'];
    linkID: SharedURLInfo['LinkID'];
    linkType: SharedURLInfo['LinkType'];
    mimeType: SharedURLInfo['MIMEType'];
    name: SharedURLInfo['Name'];
    size: SharedURLInfo['Size'];
    thumbnailURLInfo: ThumbnailURLInfo;
    nodePassphrase: string;
}

export const ERROR_CODE_INVALID_SRP_PARAMS = 2026;
const AUTH_RETRY_COUNT = 2;

const cache: {
    [linkId: string]: NodeKeys;
} = {};

function usePublicSharing() {
    const shareKey = useRef<OpenPGPKey>();
    const api = useApi();
    const publicSession = usePublicSession();

    const decryptLink = async (link: EncryptedLink, privateKey: OpenPGPKey): Promise<DecryptedLink> => {
        const name = await decryptUnsigned({ armoredMessage: link.name, privateKey });
        return {
            ...link,
            encryptedName: link.name,
            name,
            fileModifyTime: link.metaDataModifyTime,
        };
    };

    const getNodeKey = async (link: EncryptedLink, privateKey: OpenPGPKey) => {
        const nodePassphrase = await decryptUnsigned({ armoredMessage: link.nodePassphrase, privateKey });
        const nodeKey = await decryptPrivateKey(link.nodeKey, nodePassphrase);

        return nodeKey;
    };

    const getSessionKey = async (link: EncryptedLink, nodeKey: OpenPGPKey) => {
        // Folder links are no provided with ContentKeyPacket
        if (!link.isFile || !link.contentKeyPacket) {
            return undefined;
        }
        const blockKeys = base64StringToUint8Array(link.contentKeyPacket);
        const sessionKey = await getDecryptedSessionKey({ data: blockKeys, privateKeys: nodeKey });

        return sessionKey;
    };

    const retryValidation = (error: any) => {
        const apiError = getApiError(error);
        return apiError.code === ERROR_CODE_INVALID_SRP_PARAMS;
    };

    const reauth = async (token: string, password: string) => {
        const handshakeInfo = await publicSession.init(token);
        await publicSession.fetchSessionInfo(token, password, handshakeInfo);
    };

    // wrong return type
    const getSharedURLInfo = async (token: string, password: string): Promise<SharedURLInfoDecrypted> => {
        const { Token: payload } = await api<{ Token: SharedURLInfo }>(
            publicSession.queryWithSessionInfo({
                ...querySharedURLInformation(token),
                silence: true,
            })
        );

        const [passphraseAsMessage, computedPassword] = await Promise.all([
            getMessage(payload.SharePassphrase),
            computeKeyPassword(password, payload.SharePasswordSalt),
        ]);
        const sharePassphrase = await decryptMessage({
            message: passphraseAsMessage,
            passwords: [computedPassword],
        });

        const sharePrivateKey = await decryptPrivateKey(payload.ShareKey, sharePassphrase.data);
        const [name, nodePassphrase] = await Promise.all([
            decryptUnsigned({ armoredMessage: payload.Name, privateKey: sharePrivateKey }),
            decryptUnsigned({ armoredMessage: payload.NodePassphrase, privateKey: sharePrivateKey }),
        ]);

        shareKey.current = sharePrivateKey;

        const nodeKey = await decryptPrivateKey(payload.NodeKey, nodePassphrase);
        cache[payload.LinkID] = {
            privateKey: nodeKey,
        };

        if (payload.LinkType === LinkType.FILE) {
            const blockKey = base64StringToUint8Array(payload.ContentKeyPacket);
            const sessionKey = await getDecryptedSessionKey({ data: blockKey, privateKeys: nodeKey });

            cache[payload.LinkID].sessionKey = sessionKey;
        }

        return {
            expirationTime: payload.ExpirationTime,
            linkID: payload.LinkID,
            linkType: payload.LinkType,
            mimeType: payload.MIMEType,
            name,
            nodePassphrase,
            size: payload.Size,
            thumbnailURLInfo: {
                BareURL: payload.ThumbnailURLInfo.BareURL,
                Token: payload.ThumbnailURLInfo.Token,
            },
        };
    };

    const getSharedUrlChildren = async (
        token: string,
        password: string,
        linkID: string,
        page: number = 0
    ): Promise<{ Links: LinkMeta[] }> => {
        const fetchChildren = () =>
            api<{ Links: LinkMeta[] }>(
                publicSession.queryWithSessionInfo({
                    ...querySharedURLChildren(token, linkID, page, FOLDER_PAGE_SIZE),
                    silence: true,
                })
            );

        return retryOnError<{ Links: LinkMeta[] }>({
            fn: fetchChildren,
            beforeRetryCallback: reauth.bind(undefined, token, password),
            shouldRetryBasedOnError: retryValidation,
            maxRetriesNumber: AUTH_RETRY_COUNT,
        })();
    };

    const getAllSharedUrlChildren = async (token: string, password: string, linkID: string): Promise<LinkMeta[]> => {
        const links: LinkMeta[] = [];
        let isChildrenListComplete = false;
        let page = 0;

        while (!isChildrenListComplete) {
            const { Links } = await getSharedUrlChildren(token, password, linkID, page);
            Links.forEach((linkMeta) => links.push(linkMeta));

            if (Links.length < FOLDER_PAGE_SIZE) {
                isChildrenListComplete = true;
            } else {
                page += 1;
            }
        }

        return links;
    };

    const getSharedURLPayload = async (
        token: string,
        password: string,
        linkID: string,
        pagination?: {
            FromBlockIndex: number;
            PageSize: number;
        }
    ): Promise<{ Revision: SharedURLRevision }> => {
        const fetchRevision = () =>
            api<{ Revision: SharedURLRevision }>(
                publicSession.queryWithSessionInfo({
                    ...querySharedURLFileRevision(token, linkID, pagination),
                    silence: true,
                })
            );

        return retryOnError<{ Revision: SharedURLRevision }>({
            fn: fetchRevision,
            beforeRetryCallback: reauth.bind(undefined, token, password),
            shouldRetryBasedOnError: retryValidation,
            maxRetriesNumber: AUTH_RETRY_COUNT,
        })();
    };

    const getSharedURLRevision = async (
        token: string,
        password: string,
        linkID: string,
        pagination?: {
            FromBlockIndex: number;
            PageSize: number;
        }
    ): Promise<SharedURLRevision> => {
        const { Revision } = await getSharedURLPayload(token, password, linkID, pagination);

        return Revision;
    };

    const downloadThumbnail = async (linkID: string, params: ThumbnailURLInfo) => {
        const { privateKey, sessionKey } = cache[linkID];

        if (!privateKey || !sessionKey) {
            throw new Error('No keys found to decrypt the thumbnail');
        }

        const { contents } = await downloadThumbnailPure(params.BareURL, params.Token, async () => ({
            sessionKeys: sessionKey,
            privateKey,
            addressPublicKeys: [],
        }));

        return contents;
    };

    const getBlocks = async (token: string, password: string, linkId: string, pagination: Pagination) => {
        const revision = await getSharedURLRevision(token, password, linkId, pagination);
        return revision.Blocks;
    };

    const getChildren = async (token: string, password: string, linkId: string) => {
        const sharedURLChildren = await getAllSharedUrlChildren(token, password, linkId);

        return Promise.all(
            sharedURLChildren.map(linkMetaToEncryptedLink).map(async (link: EncryptedLink) => {
                const { privateKey } = cache[link.parentLinkId];

                const nodeKey = await getNodeKey(link, privateKey);
                const sessionKey = await getSessionKey(link, nodeKey);

                cache[link.linkId] = {
                    privateKey: nodeKey,
                    sessionKey,
                };
                return decryptLink(link, privateKey);
            })
        );
    };

    const initDownload = (
        token: string,
        password: string,
        name: string,
        list: LinkDownload[],
        eventCallbacks: DownloadEventCallbacks
    ): DownloadControls => {
        return initDownloadPure(name, list, {
            getChildren: (abortSignal: AbortSignal, shareId: string, linkId: string) =>
                getChildren(token, password, linkId),
            getBlocks: (abortSignal: AbortSignal, shareId: string, linkId: string, pagination: Pagination) =>
                getBlocks(token, password, linkId, pagination),
            getKeys: async (abortSignal: AbortSignal, shareId: string, linkId: string) => {
                const linkKeys = cache[linkId];
                return {
                    privateKey: linkKeys.privateKey,
                    sessionKeys: linkKeys.sessionKey,
                    addressPublicKeys: [],
                };
            },
            ...eventCallbacks,
        });
    };

    const submitAbuseReport = async (params: {
        abuseCategory: string;
        reporterEmail?: string;
        reporterMessage?: string;
        password?: string;
        shareURL: string;
        nodePassphrase: string;
    }): Promise<void> => {
        return api(
            querySubmitAbuseReport({
                ShareURL: params.shareURL,
                Password: params.password,
                AbuseCategory: params.abuseCategory,
                ReporterEmail: params.reporterEmail,
                ReporterMessage: params.reporterMessage,
                ResourcePassphrase: params.nodePassphrase,
            })
        );
    };
    return {
        getSharedURLInfo,
        initDownload,
        downloadThumbnail,
        initHandshake: publicSession.init,
        initSession: publicSession.fetchSessionInfo,
        submitAbuseReport,
    };
}

export default usePublicSharing;
