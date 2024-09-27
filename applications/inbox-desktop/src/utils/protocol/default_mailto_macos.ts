import { app } from "electron";
import { DefaultProtocolActual } from "@proton/shared/lib/desktop/DefaultProtocol";

// Electron app protocol isDefaultProtocolClient for mailto works correctly only for macOS.
export const checkDefaultMailtoClientMac = (): DefaultProtocolActual => ({
    isDefault: app.isDefaultProtocolClient("mailto"),
    wasChecked: true,
});

// Electron app protocol setAsDefaultProtocolClient for mailto works correctly only for macOS.
export const setDefaultMailtoMac = () => app.setAsDefaultProtocolClient("mailto");
