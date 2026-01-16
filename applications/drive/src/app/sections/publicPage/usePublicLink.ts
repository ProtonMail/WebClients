import { useCallback, useState } from 'react';

import { useAuthentication } from '@proton/components';
import { type NodeEntity, NodeType, getDrive, splitNodeUid } from '@proton/drive';
import { uploadManager } from '@proton/drive/modules/upload';

import { downloadManager } from '../../managers/download/DownloadManager';
import { handleSdkError } from '../../utils/errorHandling/useSdkErrorHandler';
import { getNodeEntity } from '../../utils/sdk/getNodeEntity';
import { getPublicLinkClient, setPublicLinkClient } from './publicLinkClient';
import { usePublicAuthStore } from './usePublicAuth.store';

interface UsePublicLinkResult {
    rootNode: NodeEntity | undefined;
    isLoading: boolean;
    isPasswordNeeded: boolean;
    customPassword: string;
    setCustomPassword: (password: string) => void;
    loadPublicLink: () => void;
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

export const usePublicLink = (): UsePublicLinkResult => {
    const [isPasswordNeeded, setIsPasswordNeeded] = useState(false);
    const [customPassword, setCustomPassword] = useState('');
    const [rootNode, setRootNode] = useState<NodeEntity>();
    const [isLoading, setIsLoading] = useState(!rootNode);
    const authentication = useAuthentication();

    const loadPublicLink = useCallback(async () => {
        const drive = getDrive();
        if (!drive) {
            return;
        }

        let cancelled = false;

        void drive.experimental
            .getPublicLinkInfo(window.location.href)
            .then(async (publicLinkInfo) => {
                if (cancelled) {
                    return;
                }

                if (publicLinkInfo.isCustomPasswordProtected) {
                    setIsPasswordNeeded(publicLinkInfo.isCustomPasswordProtected);
                } else {
                    const maybeNode = await loadRootNode(
                        window.location.href,
                        customPassword,
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
                            const nodeTypeUrl = node.type === NodeType.Folder ? 'folder' : 'file';
                            const url = `/${parentNode.deprecatedShareId}/${nodeTypeUrl}/${splitNodeUid(node.uid).nodeId}`;
                            window.location.replace(url);
                            return;
                        }
                    }

                    setRootNode(node);
                }
            })
            .catch((e) => {
                handleSdkError(e);
            })
            .finally(() => {
                if (cancelled) {
                    return;
                }
                setIsLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [authentication, customPassword]);

    return {
        rootNode,
        isLoading,
        isPasswordNeeded,
        customPassword,
        setCustomPassword,
        loadPublicLink,
    };
};
