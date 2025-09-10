import { useCallback } from 'react';

import { c } from 'ttag';
import { useShallow } from 'zustand/react/shallow';

import { NodeType, useDrive } from '@proton/drive/index';

import { handleSdkError, useSdkErrorHandler } from '../../../utils/errorHandling/useSdkErrorHandler';
import { getNodeEntity } from '../../../utils/sdk/getNodeEntity';
import { useDeviceStore } from '../../devices/devices.store';
import { getDeviceName } from '../../devices/getDeviceName';
import type { SidebarItem } from './useSidebar.store';
import { useSidebarStore } from './useSidebar.store';

export const useSidebarFolders = () => {
    const { drive } = useDrive();
    const { setItem, getItem, updateItem, toggleExpanded } = useSidebarStore(
        useShallow((state) => ({
            setItem: state.setItem,
            getItem: state.getItem,
            updateItem: state.updateItem,
            toggleExpanded: state.toggleExpanded,
        }))
    );

    const { setDevice, setDeviceLoading } = useDeviceStore(
        useShallow((state) => ({
            setDevice: state.setDevice,
            setDeviceLoading: state.setLoading,
        }))
    );
    const { handleError } = useSdkErrorHandler();

    const loadFolderChildren = async (folderUid: string) => {
        const parent = getItem(folderUid);
        if (!parent) {
            return handleSdkError(
                new Error(`Cannot load children for folder ${folderUid} since it's not in the store`)
            );
        }

        updateItem(folderUid, { hasLoadedChildren: false, isLoading: true });
        try {
            for await (const maybeNode of drive.iterateFolderChildren(folderUid)) {
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
            handleError(error, { fallbackMessage: `Failed to load children for folder ${folderUid}` });
        } finally {
            updateItem(folderUid, { hasLoadedChildren: true, isLoading: false });
        }
    };

    const loadDevicesRoot = useCallback(async () => {
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
            handleError(e, { fallbackMessage: errorNotiticationText });
        }
        setDeviceLoading(false);
    }, [setDeviceLoading, drive, setDevice, setItem, handleError]);

    const loadFoldersRoot = useCallback(async () => {
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
    }, [drive, setItem]);

    const toggleExpand = async (uid: string) => {
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
