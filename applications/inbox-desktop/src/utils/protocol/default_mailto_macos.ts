import { app } from "electron";
import { DefaultProtocol } from "./types";

// Electron app protocol isDefaultProtocolClient for mailto works correctly only for macOS.
export const checkDefaultMailtoClientMac = (): DefaultProtocol => ({
    isDefault: app.isDefaultProtocolClient("mailto"),
    isChecked: true,
});

// Electron app protocol setAsDefaultProtocolClient for mailto works correctly only for macOS.
export const setDefaultMailtoMac = () => app.setAsDefaultProtocolClient("mailto");
