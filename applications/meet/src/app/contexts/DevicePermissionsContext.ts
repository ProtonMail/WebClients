import { createContext, useContext } from 'react';

export const DevicePermissionsContext = createContext<{
    devicePermissions: {
        camera: PermissionState;
        microphone: PermissionState;
    };
    setDevicePermissions: ({ camera, microphone }: { camera?: PermissionState; microphone?: PermissionState }) => void;
}>({
    devicePermissions: {
        camera: 'prompt',
        microphone: 'prompt',
    },
    setDevicePermissions: () => {},
});

export const useDevicePermissionsContext = () => {
    return useContext(DevicePermissionsContext);
};
