import { useCallback, useState } from 'react';

import { c } from 'ttag';

import type { MaybeNode, ProtonDriveClient, Result } from '@proton/drive/index';
import { handleSdkError, sendErrorReport } from '@proton/drive/legacy/errorHandling';
import { getNodeEntity } from '@proton/drive/legacy/sdkUtils/getNodeEntity';
import { NodeLocation, getNodeLocation } from '@proton/drive/modules/nodes';

import useDriveNavigation from '../../../legacy/hooks/drive/useNavigate';
import type { CrumbDefinition } from '../../../statelessComponents/Breadcrumbs/types';
import { getSignatureIssues } from '../../../utils/sdk/getSignatureIssues';

export const SYNTHETIC_UID_DEVICES = 'synthetic-uid-devices';
export const SYNTHETIC_UID_SHARED_WITH_ME = 'synthetic-uid-shared-with-me';

export const useFolderViewBreadcrumbs = (driveClient: ProtonDriveClient) => {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<CrumbDefinition[]>([]);
    const { navigateToDevices, navigateToSharedWithMe } = useDriveNavigation();

    const computeCrumbs = useCallback(
        async (nodeUid: string, driveClient: ProtonDriveClient): Promise<Result<CrumbDefinition[], Error>> => {
            let hierarchy: MaybeNode[];
            try {
                hierarchy = await driveClient.getNodeHierarchy(nodeUid);
            } catch (e) {
                return {
                    ok: false,
                    error: e instanceof Error ? e : new Error(String(e)),
                };
            }
            const nodeLocation = await getNodeLocation(driveClient, hierarchy[0]);
            if (!nodeLocation.ok) {
                return {
                    ok: false,
                    error: nodeLocation.error,
                };
            }

            const pathItems: CrumbDefinition[] = hierarchy.map((maybeNode) => {
                const nodeEntity = getNodeEntity(maybeNode).node;
                const signatureIssuesResult = getSignatureIssues(maybeNode);
                return {
                    uid: nodeEntity.uid,
                    name: nodeEntity.name,
                    haveSignatureIssues: !signatureIssuesResult.ok,
                    supportDropOperations: true,
                };
            });

            const lastPathItem = pathItems[pathItems.length - 1];
            if (lastPathItem) {
                // Do not allow drag'n dropping in current folder.
                lastPathItem.supportDropOperations = false;
            }

            if (nodeLocation.value === NodeLocation.MY_FILES) {
                if (pathItems[0]) {
                    pathItems[0].name = c('Title').t`My files`;
                }
            } else if (nodeLocation.value === NodeLocation.DEVICES) {
                if (pathItems[0]) {
                    // Dropping files at the root of a device is not allowed by the SDK.
                    pathItems[0].supportDropOperations = false;
                }

                pathItems.unshift({
                    uid: SYNTHETIC_UID_DEVICES,
                    name: c('Title').t`Computers`,
                    haveSignatureIssues: false,
                    supportDropOperations: false,
                    customOnItemClick: () => {
                        void navigateToDevices();
                    },
                });
            } else if (nodeLocation.value === NodeLocation.SHARED_WITH_ME) {
                pathItems.unshift({
                    uid: SYNTHETIC_UID_SHARED_WITH_ME,
                    name: c('Title').t`Shared with me`,
                    haveSignatureIssues: false,
                    supportDropOperations: false,
                    customOnItemClick: () => {
                        void navigateToSharedWithMe();
                    },
                });
            } else {
                sendErrorReport(
                    new Error(`Unsupported NodeLocation <${nodeLocation.value}> for useFolderViewBreadcrumbs`)
                );
            }
            return {
                ok: true,
                value: pathItems,
            };
        },
        [navigateToDevices, navigateToSharedWithMe]
    );

    const load = useCallback(
        async (nodeUid: string) => {
            setLoading(true);

            const crumbsResult = await computeCrumbs(nodeUid, driveClient);
            if (crumbsResult.ok) {
                setData(crumbsResult.value);
            } else {
                setData([]);
                handleSdkError(crumbsResult.error);
            }

            setLoading(false);
        },
        [computeCrumbs, driveClient]
    );

    return {
        loading,
        data,
        load,
    };
};
