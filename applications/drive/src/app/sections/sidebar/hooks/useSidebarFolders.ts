import { useCallback } from 'react';

import { c } from 'ttag';

import { NodeType, useDrive } from '@proton/drive/index';

import { handleSdkError } from '../../../utils/errorHandling/handleSdkError';
import { getNodeEntity } from '../../../utils/sdk/getNodeEntity';
import { getDeviceName } from '../../../utils/sdk/getNodeName';
import { useDeviceStore } from '../../devices/devices.store';
import type { SidebarItem } from './useSidebar.store';
import { useSidebarStore } from './useSidebar.store';

export const useSidebarFolders = () => {
    const { drive } = useDrive();

    const loadFolderChildren = async (folderUid: string) => {
        const { setItem, getItem, updateItem } = useSidebarStore.getState();
        const parent = getItem(folderUid);
        if (!parent) {
            return handleSdkError(
                new Error(`Cannot load children for folder ${folderUid} since it's not in the store`),
                { showNotification: false }
            );
        }

        updateItem(folderUid, { hasLoadedChildren: false, isLoading: true });
        try {
            for await (const maybeNode of drive.iterateFolderChildren(folderUid, { type: NodeType.Folder })) {
                const { node } = getNodeEntity(maybeNode);
                if (node.type === NodeType.Folder) {
                    setItem({
                        uid: node.uid,
                        name: node.name,
                        parentUid: folderUid,
                        isLoading: false,
                        isExpanded: false,
                        level: parent.level + 1,
                        hasLoadedChildren: false,
                    });
                }
            }
        } catch (error) {
            handleSdkError(error, { fallbackMessage: `Failed to load children for folder ${folderUid}` });
        } finally {
            updateItem(folderUid, { hasLoadedChildren: true, isLoading: false });
        }
    };

    const loadDevicesRoot = useCallback(async () => {
        const { setItem } = useSidebarStore.getState();
        const { setDevice, setLoading: setDeviceLoading } = useDeviceStore.getState();
        setDeviceLoading(true);
        try {
            for await (const device of drive.iterateDevices()) {
                setDevice(device);

                const deviceRootFolder: SidebarItem = {
                    uid: device.rootFolderUid,
                    name: getDeviceName(device),
                    level: 1,
                    parentUid: 'computers',
                    isLoading: false,
                    isExpanded: false,
                    hasLoadedChildren: false,
                };
                setItem(deviceRootFolder);
            }
        } catch (e) {
            const errorNotiticationText = c('Notification').t`Error while listing devices`;
            handleSdkError(e, { fallbackMessage: errorNotiticationText });
        }
        setDeviceLoading(false);
    }, [drive]);

    const loadFoldersRoot = useCallback(async () => {
        const { setItem } = useSidebarStore.getState();

        const maybeRootFolder = await drive.getMyFilesRootFolder();
        const { node } = getNodeEntity(maybeRootFolder);
        const item = {
            parentUid: undefined,
            level: -1,
            uid: node.uid,
            name: node.name,
            isExpanded: false,
            isLoading: false,
            hasLoadedChildren: false,
        };
        setItem(item);
        return item;
    }, [drive]);

    const toggleExpand = async (uid: string) => {
        const { getItem, toggleExpanded } = useSidebarStore.getState();

        const item = getItem(uid);
        const wasExpanded = item?.isExpanded ?? false;
        toggleExpanded(uid);
        if (!wasExpanded) {
            await loadFolderChildren(uid);
        }
    };

    return {
        loadFolderChildren,
        loadFoldersRoot,
        toggleExpand,
        loadDevicesRoot,
    };
};
