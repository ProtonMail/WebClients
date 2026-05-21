import { DeviceType, splitNodeUid, useDrive } from '@proton/drive';

// Only used for debug purposed, see DriveSidebar.tsx
export function useCreateDevice() {
    const { drive } = useDrive();

    const createSdkDevice = async () => {
        const device = await drive.createDevice('root', DeviceType.Windows);

        return {
            id: splitNodeUid(device.uid).nodeId,
            linkId: splitNodeUid(device.rootFolderUid).nodeId,
            volumeId: splitNodeUid(device.rootFolderUid).volumeId,
            shareId: device.shareId,
        };
    };

    return {
        createDevice: createSdkDevice,
    };
}
