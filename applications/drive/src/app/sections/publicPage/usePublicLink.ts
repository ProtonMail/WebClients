import { useCallback, useRef, useState } from 'react';

import { c } from 'ttag';

import { useAuthentication, useNotifications } from '@proton/components';
import { type NodeEntity, NodeType, ValidationError, getDrive, splitNodeUid } from '@proton/drive';
import { uploadManager } from '@proton/drive/modules/upload';
import { isNativeProtonDocsAppFile } from '@proton/shared/lib/helpers/mimetype';

import { downloadManager } from '../../managers/download/DownloadManager';
import {
    getOpenInDocsInfo,
    openDocsOrSheetsDocument,
    openPublicDocsOrSheetsDocument,
} from '../../utils/docs/openInDocs';
import { useSdkErrorHandler } from '../../utils/errorHandling/useSdkErrorHandler';
import { getNodeEntity } from '../../utils/sdk/getNodeEntity';
import { getPublicLinkClient, setPublicLinkClient } from './publicLinkClient';
import { usePublicAuthStore } from './usePublicAuth.store';
import { getPublicTokenAndPassword } from './utils/getPublicTokenAndPassword';

interface UsePublicLinkResult {
    rootNode: NodeEntity | undefined;
    isLoading: boolean;
    isPasswordNeeded: boolean;
    customPassword: string;
    loadPublicLink: (newCustomPassword?: string) => Promise<void>;
}

export const loadRootNode = async (url: string, password: string | undefined, isAnonymous: boolean) => {
    const drive = getDrive();
    const publicLinkClient = await drive.experimental.authPublicLink(url, password, isAnonymous);
    setPublicLinkClient(publicLinkClient);
    downloadManager.setDriveClient(publicLinkClient);
    uploadManager.setDriveClient(publicLinkClient);
    const rootNode = await publicLinkClient.getRootNode();
    return rootNode;
};

const redirectToPrivateApp = async (
    deprecatedShareId: string,
    uid: string,
    type: NodeType,
    mediaType: string | undefined,
    returnPath?: string
) => {
    if (mediaType) {
        const openInDocsInfo = getOpenInDocsInfo(mediaType);
        if (openInDocsInfo) {
            await openDocsOrSheetsDocument({
                uid,
                type: openInDocsInfo.type,
                isNative: openInDocsInfo.isNative,
                openBehavior: 'redirect',
            });
            return;
        }
    }
    const nodeTypeUrl = type === NodeType.Folder ? 'folder' : 'file';
    const url = `/${deprecatedShareId}/${nodeTypeUrl}/${splitNodeUid(uid).nodeId}${returnPath ? `?r=${returnPath}` : ''}`;
    window.location.replace(url);
};

export const usePublicLink = (): UsePublicLinkResult => {
    const [isPasswordNeeded, setIsPasswordNeeded] = useState(false);
    const [customPassword, setCustomPassword] = useState('');
    const [rootNode, setRootNode] = useState<NodeEntity>();
    const [isLoading, setIsLoading] = useState(true);
    const authentication = useAuthentication();
    const passwordRef = useRef('');
    const { createNotification } = useNotifications();
    const { handleError } = useSdkErrorHandler();
    const loadPublicLink = useCallback(
        async (newCustomPassword?: string) => {
            const drive = getDrive();
            if (!drive) {
                return;
            }

            setIsLoading(true);
            let isRedirecting = false;

            if (newCustomPassword) {
                passwordRef.current = newCustomPassword;
            }

            try {
                const publicLinkInfo = await drive.experimental.getPublicLinkInfo(window.location.href);

                if (publicLinkInfo.isCustomPasswordProtected && !passwordRef.current) {
                    setIsPasswordNeeded(true);
                    return;
                }

                const maybeNode = await loadRootNode(
                    window.location.href,
                    passwordRef.current || undefined,
                    !authentication.getUID()
                );

                if (!maybeNode) {
                    return;
                }

                const { node } = getNodeEntity(maybeNode);
                usePublicAuthStore.getState().setPublicRole(node.directRole);
                if (node.parentUid) {
                    const maybeParentNode = await getPublicLinkClient().getNode(node.parentUid);
                    const { node: parentNode } = getNodeEntity(maybeParentNode);
                    if (parentNode.deprecatedShareId) {
                        isRedirecting = true;
                        await redirectToPrivateApp(parentNode.deprecatedShareId, node.uid, node.type, node.mediaType);
                        return;
                    }
                } else if (node.membership !== undefined && node.deprecatedShareId) {
                    const returnPath =
                        node.type === NodeType.File || node.type === NodeType.Photo ? '/shared-with-me' : '';
                    isRedirecting = true;
                    await redirectToPrivateApp(node.deprecatedShareId, node.uid, node.type, node.mediaType, returnPath);
                    return;
                }

                if (node.mediaType && isNativeProtonDocsAppFile(node.mediaType)) {
                    const openInDocsInfo = getOpenInDocsInfo(node.mediaType);
                    if (openInDocsInfo) {
                        const { token, urlPassword } = getPublicTokenAndPassword(window.location.pathname);
                        await openPublicDocsOrSheetsDocument({
                            uid: node.uid,
                            type: openInDocsInfo.type,
                            isNative: openInDocsInfo.isNative,
                            openBehavior: 'redirect',
                            token,
                            urlPassword,
                            customPassword: passwordRef.current,
                        });
                        return;
                    }
                }

                setCustomPassword(passwordRef.current);
                setRootNode(node);
                setIsPasswordNeeded(false);
            } catch (e) {
                if (e instanceof ValidationError && e.code === 2026 && !!newCustomPassword) {
                    createNotification({
                        type: 'error',
                        text: c('Error').t`Incorrect password. Please try again.`,
                    });
                    return;
                }
                handleError(e);
            } finally {
                if (!isRedirecting) {
                    setIsLoading(false);
                }
            }
        },
        [authentication, createNotification, handleError]
    );

    return {
        rootNode,
        isLoading,
        isPasswordNeeded,
        customPassword,
        loadPublicLink,
    };
};
