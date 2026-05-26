import { useCallback, useRef, useState } from 'react';

import { c } from 'ttag';

import { useAuthentication, useNotifications } from '@proton/components';
import {
    DecryptionError,
    type NodeEntity,
    NodeType,
    ServerError,
    ValidationError,
    getDrive,
    splitNodeUid,
} from '@proton/drive';
import { getNodeEntity } from '@proton/drive/legacy/sdkUtils/getNodeEntity';
import { uploadManager } from '@proton/drive/modules/upload';
import metrics from '@proton/metrics';
import { HTTP_STATUS_CODE } from '@proton/shared/lib/constants';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';
import { isNativeProtonDocsAppFile } from '@proton/shared/lib/helpers/mimetype';

import { getMetricsUserPlan } from '../../legacy/store/_user/getMetricsUserPlan';
import { downloadManager } from '../../modules/download/DownloadManager';
import {
    getOpenInDocsInfo,
    openDocsOrSheetsDocument,
    openPublicDocsOrSheetsDocument,
} from '../../utils/docs/openInDocs';
import { sendErrorReport } from '../../utils/errorHandling';
import { is4xx, is5xx } from '../../utils/errorHandling/apiErrors';
import { Actions, countActionWithTelemetry } from '../../utils/telemetry';
import { setPublicLinkClient } from './publicLinkClient';
import { usePublicAuthStore } from './usePublicAuth.store';
import { getPublicTokenAndPassword } from './utils/getPublicTokenAndPassword';
import { shouldRedirectToPrivateApp } from './utils/shouldRedirectToPrivateApp';

export const getErrorMetricTypeForSdkError = (error: unknown) => {
    if (error instanceof ServerError) {
        if (error.statusCode === HTTP_STATUS_CODE.NOT_FOUND) {
            return 'does_not_exist_or_expired';
        }
        if (error.statusCode && is4xx(error.statusCode)) {
            return '4xx';
        }
        if (error.statusCode && is5xx(error.statusCode)) {
            return '5xx';
        }
    }
    if (error instanceof DecryptionError) {
        return 'crypto';
    }
    return 'unknown';
};

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
    const { accessToken, uid } = publicLinkClient.experimental.getSessionInfo();
    metrics.setAuthHeaders(uid, accessToken);
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
        if (openInDocsInfo?.isNative) {
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

            if (!window.location.hash && !passwordRef.current) {
                setIsPasswordNeeded(true);
                setIsLoading(false);
                return;
            }

            const sdkUrl = window.location.hash
                ? window.location.href
                : `${window.location.href}#${passwordRef.current}`;

            try {
                const publicLinkInfo = await drive.experimental.getPublicLinkInfo(sdkUrl);

                if (publicLinkInfo.isCustomPasswordProtected && !passwordRef.current) {
                    setIsPasswordNeeded(true);
                    return;
                }

                const maybeNode = await loadRootNode(
                    sdkUrl,
                    !window.location.hash ? undefined : passwordRef.current,
                    !authentication.getUID()
                );

                if (!maybeNode) {
                    return;
                }

                const { node } = getNodeEntity(maybeNode);
                usePublicAuthStore.getState().setPublicRole(node.directRole);

                if (
                    shouldRedirectToPrivateApp(
                        publicLinkInfo.directAccess?.directRole,
                        publicLinkInfo.directAccess?.publicRole
                    ) &&
                    node.deprecatedShareId
                ) {
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
                metrics.drive_public_share_load_success_total.increment({
                    type: [NodeType.File, NodeType.Photo].includes(node.type) ? 'file' : 'folder',
                    plan: getMetricsUserPlan({ isPublicContext: true }),
                });
                void countActionWithTelemetry(Actions.PublicLinkVisit);
            } catch (e) {
                if (
                    e instanceof ValidationError &&
                    e.code === API_CUSTOM_ERROR_CODES.PERMISSION_DENIED &&
                    !!newCustomPassword
                ) {
                    createNotification({
                        type: 'error',
                        text: c('Error').t`Incorrect password. Please try again.`,
                    });
                    return;
                }
                // TODO: Check if we can get the type of the share.
                // Issue is that probably the issue will happened during the load of the rootNode
                metrics.drive_public_share_load_error_total.increment({
                    type: 'unknown',
                    plan: getMetricsUserPlan({ isPublicContext: true }),
                    error: getErrorMetricTypeForSdkError(e),
                });
                const isNotFound = e instanceof ValidationError && e.code === API_CUSTOM_ERROR_CODES.NOT_FOUND;
                if (!isNotFound) {
                    sendErrorReport(e, { tags: { driveMetricEvent: 'publicPageError' } });
                }
            } finally {
                if (!isRedirecting) {
                    setIsLoading(false);
                }
            }
        },
        [authentication, createNotification]
    );

    return {
        rootNode,
        isLoading,
        isPasswordNeeded,
        customPassword,
        loadPublicLink,
    };
};
