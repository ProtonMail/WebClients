import { app } from "electron";
import { DefaultProtocol } from "./types";

// Electron app protocol isDefaultProtocolClient for mailto works only for macOS.
export const checkDefaultMailtoClientMac = (): DefaultProtocol =>
    ({
        isDefault: app.isDefaultProtocolClient("mailto"),
        isChecked: true,
    }) as DefaultProtocol;

export const setDefaultMailtoMac = () => app.setAsDefaultProtocolClient("mailto");
